package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/mail"
	"frontline-college/backend/internal/models"
	"frontline-college/backend/internal/razz"
	"frontline-college/backend/internal/requestlog"

	"github.com/gin-gonic/gin"
)

// RazzWebhookHandler receives Razz's "virtual_account.paid" webhook
// (docs/payment-collection-api.md) — the automatic counterpart to an admin
// clicking "Verify" on a manually-uploaded PaymentProof. Public route, no
// JWT: the HMAC signature check below is this route's entire authentication.
// Every delivery (accepted or rejected) is logged to disk via requestlog,
// same as every outbound Razz call — see internal/requestlog.
// Route: POST /api/webhooks/razz
func RazzWebhookHandler(c *gin.Context) {
	cfg := config.Cfg

	var logStatus int
	var logResponse interface{}
	var rawBody []byte
	defer func() {
		requestlog.LogWebhook("razz", c.Request.Method, c.Request.URL.Path, c.Request.Header, rawBody, logStatus, logResponse)
	}()

	respond := func(status int, body gin.H) {
		logStatus = status
		logResponse = body
		c.JSON(status, body)
	}

	var err error
	rawBody, err = io.ReadAll(c.Request.Body)
	if err != nil {
		respond(http.StatusBadRequest, gin.H{"error": "cannot read body"})
		return
	}

	if !razz.VerifySignature(cfg.RazzWebhookSecret, rawBody, c.GetHeader("X-Razz-Signature")) {
		respond(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
		return
	}

	var payload razz.WebhookPayload
	if err := json.Unmarshal(rawBody, &payload); err != nil {
		respond(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Only "virtual_account.paid" ever needs action from us today — ack
	// anything else so Razz doesn't keep retrying a notification we have no
	// use for, same reasoning as Razz's own inward-credit webhook acking an
	// unrelated/unsettled notification rather than erroring on it.
	if payload.Event != "virtual_account.paid" || payload.Status != "paid" {
		respond(http.StatusOK, gin.H{"status": true, "message": "noted"})
		return
	}

	var va models.VirtualAccount
	if err := db.DB.Where("reference = ?", payload.Reference).First(&va).Error; err != nil {
		log.Printf("razz webhook: no local virtual account for reference %s", payload.Reference)
		respond(http.StatusOK, gin.H{"status": true, "message": "reference not found"})
		return
	}

	// Idempotency: a redelivered webhook for an already-settled reference is
	// a no-op, not a double-credit — Razz documents retrying on anything
	// other than a 2xx response.
	if va.Status == models.VAStatusPaid {
		respond(http.StatusOK, gin.H{"status": true, "message": "already processed"})
		return
	}

	var app models.Application
	if err := db.DB.First(&app, va.ApplicationID).Error; err != nil {
		log.Printf("razz webhook: application %d not found for virtual account %s", va.ApplicationID, va.Reference)
		respond(http.StatusOK, gin.H{"status": true, "message": "application not found"})
		return
	}

	now := time.Now()
	if payload.PaidAt != nil {
		if parsed, perr := time.Parse(time.RFC3339, *payload.PaidAt); perr == nil {
			now = parsed
		}
	}

	if err := db.DB.Model(&models.VirtualAccount{}).Where("id = ? AND status = ?", va.ID, models.VAStatusPending).
		Updates(map[string]any{"status": models.VAStatusPaid, "paid_at": now}).Error; err != nil {
		respond(http.StatusInternalServerError, gin.H{"error": "could not update virtual account"})
		return
	}

	proof := models.PaymentProof{
		ApplicationID: app.ID,
		Type:          va.Type,
		Amount:        va.Amount,
		Status:        models.PaymentStatusVerified,
		Notes:         "Auto-confirmed via Razz virtual account (ref: " + va.Reference + ")",
		UploadedAt:    now,
		ReviewedAt:    &now,
	}
	if err := db.DB.Create(&proof).Error; err != nil {
		respond(http.StatusInternalServerError, gin.H{"error": "payment confirmed but could not record proof"})
		return
	}

	nextStatus := models.NextStatusAfterVerifiedPayment(va.Type)
	if err := db.DB.Model(&models.Application{}).Where("id = ?", app.ID).Update("status", nextStatus).Error; err != nil {
		respond(http.StatusInternalServerError, gin.H{"error": "payment confirmed but application status update failed"})
		return
	}

	var student models.Student
	db.DB.First(&student, app.StudentID)
	label := "application fee"
	if va.Type == models.PaymentTypeSchoolFee {
		label = "school fee"
	}
	body := "<p>Dear " + student.FirstName + ",</p><p>Your " + label + " payment for application <strong>" + app.ApplicationNumber +
		"</strong> has been received and automatically confirmed.</p>"
	mail.Async(student.Email, student.FirstName, "Payment confirmed — "+app.ApplicationNumber, mail.WrapTemplate("Payment Confirmed", body))

	respond(http.StatusOK, gin.H{"status": true, "message": "payment confirmed"})
}
