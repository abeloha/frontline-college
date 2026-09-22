// Package razz is a small client for Razz's Payment Collection API
// (docs/payment-collection-api.md) — the disposable-virtual-account payment
// method offered alongside the original manual bank-transfer flow. Mirrors
// internal/mail's shape: plain functions, reads *config.Config directly,
// stdlib net/http only (no third-party HTTP client in go.mod).
package razz

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/requestlog"
)

var httpClient = &http.Client{Timeout: 15 * time.Second}

// namespace is requestlog's top-level directory for every Razz call —
// outbound requests land under {LOG_PATH}/razz/<operation>/, matching the
// Razz API's own storage/logs/vfd/<operation>/ convention.
const namespace = "razz"

// doRequest performs one HTTP round trip to Razz and unconditionally logs
// it (request + response, or the error if the round trip itself failed) via
// requestlog.LogCall before returning — every Razz call must go through
// this so none can be added later without being logged.
func doRequest(operation, method, url string, body interface{}, apiKey string) (int, []byte, error) {
	start := time.Now()

	var bodyBytes []byte
	if body != nil {
		var err error
		bodyBytes, err = json.Marshal(body)
		if err != nil {
			return 0, nil, fmt.Errorf("razz: marshal request failed: %w", err)
		}
	}

	req, err := http.NewRequest(method, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return 0, nil, fmt.Errorf("razz: build request failed: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	// Logged headers never include the real API key — same masking
	// convention as the Razz API's own vfd.go (maskToken).
	logHeaders := map[string]string{"Content-Type": "application/json"}
	if apiKey != "" {
		logHeaders["Authorization"] = "Bearer " + maskToken(apiKey)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		requestlog.LogCall(namespace, operation, method, url, logHeaders, json.RawMessage(bodyOrNull(bodyBytes)), 0, "", time.Since(start), err)
		return 0, nil, fmt.Errorf("razz: %s request failed: %w", operation, err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		requestlog.LogCall(namespace, operation, method, url, logHeaders, json.RawMessage(bodyOrNull(bodyBytes)), resp.StatusCode, "", time.Since(start), err)
		return resp.StatusCode, nil, fmt.Errorf("razz: reading response failed: %w", err)
	}

	requestlog.LogCall(namespace, operation, method, url, logHeaders, json.RawMessage(bodyOrNull(bodyBytes)), resp.StatusCode, string(respBytes), time.Since(start), nil)
	return resp.StatusCode, respBytes, nil
}

func bodyOrNull(b []byte) []byte {
	if len(b) == 0 {
		return []byte("null")
	}
	return b
}

func maskToken(tok string) string {
	if len(tok) <= 6 {
		return "***"
	}
	return "***" + tok[len(tok)-6:]
}

// CreateVirtualAccountInput is everything needed to request one disposable
// account. AmountKobo is kobo (Razz's public API contract), not Naira.
type CreateVirtualAccountInput struct {
	AmountKobo        int64
	CustomerReference string
	Description       string
	PayerName         string
	PayerEmail        string
}

// CreateVirtualAccountResult holds the fields callers need out of Razz's
// response — see docs/payment-collection-api.md's "Create a virtual
// account" response shape.
type CreateVirtualAccountResult struct {
	Reference     string
	AccountNumber string
	BankName      string
	ExpiresAt     time.Time
}

// CreateVirtualAccount calls POST {RazzAPIBaseURL}/virtual-accounts.
func CreateVirtualAccount(cfg *config.Config, in CreateVirtualAccountInput) (*CreateVirtualAccountResult, error) {
	payload := map[string]interface{}{
		"amount": in.AmountKobo,
	}
	if in.CustomerReference != "" {
		payload["customer_reference"] = in.CustomerReference
	}
	if in.Description != "" {
		payload["description"] = in.Description
	}
	if in.PayerName != "" {
		payload["payer_name"] = in.PayerName
	}
	if in.PayerEmail != "" {
		payload["payer_email"] = in.PayerEmail
	}

	url := strings.TrimRight(cfg.RazzAPIBaseURL, "/") + "/virtual-accounts"
	status, respBytes, err := doRequest("create_virtual_account", http.MethodPost, url, payload, cfg.RazzAPIKey)
	if err != nil {
		return nil, err
	}

	var parsed struct {
		Status  bool   `json:"status"`
		Error   string `json:"error"`
		Message string `json:"message"`
		Data    struct {
			Reference     string `json:"reference"`
			AccountNumber string `json:"account_number"`
			BankName      string `json:"bank_name"`
			ExpiresAt     string `json:"expires_at"`
		} `json:"data"`
	}
	if err := json.Unmarshal(respBytes, &parsed); err != nil {
		return nil, fmt.Errorf("razz: parsing response failed (http %d): %w", status, err)
	}
	if !parsed.Status || status < 200 || status >= 300 {
		msg := parsed.Error
		if msg == "" {
			msg = parsed.Message
		}
		if msg == "" {
			msg = fmt.Sprintf("http %d", status)
		}
		return nil, fmt.Errorf("razz: create virtual account failed: %s", msg)
	}

	expiresAt, _ := time.Parse(time.RFC3339, parsed.Data.ExpiresAt)

	return &CreateVirtualAccountResult{
		Reference:     parsed.Data.Reference,
		AccountNumber: parsed.Data.AccountNumber,
		BankName:      parsed.Data.BankName,
		ExpiresAt:     expiresAt,
	}, nil
}

// WebhookPayload mirrors Razz's documented "virtual_account.paid" webhook
// body verbatim — see docs/payment-collection-api.md's "Webhook" section.
type WebhookPayload struct {
	Event                 string  `json:"event"`
	Reference             string  `json:"reference"`
	CustomerReference     *string `json:"customer_reference"`
	AccountNumber         string  `json:"account_number"`
	Amount                int64   `json:"amount"`
	PaidAmount            int64   `json:"paid_amount"`
	Currency              string  `json:"currency"`
	Status                string  `json:"status"`
	PaidAt                *string `json:"paid_at"`
	OriginatorAccountName *string `json:"originator_account_name"`
}

// VerifySignature checks the X-Razz-Signature header — the lowercase hex
// HMAC-SHA256 of the exact raw request body, keyed by the integration's
// webhook secret. This check is the webhook route's entire authentication;
// there is no other auth on it. Uses hmac.Equal (constant-time) rather than
// a plain string comparison, matching standard signature-verification
// practice.
func VerifySignature(secret string, rawBody []byte, signatureHeader string) bool {
	if secret == "" || signatureHeader == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(rawBody)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(strings.TrimSpace(signatureHeader)))
}
