// Package requestlog is a dedicated, self-contained logger for every
// request/response this backend exchanges with a third-party API (Razz,
// ...) and every inbound webhook it receives from one. Mirrors the Razz
// API's own logging conventions exactly (app/services/vfd/vfd_logger.go and
// app/services/webhooklog/webhook_logger.go): one file per calendar day,
// under LOG_PATH:
//
//	{LOG_PATH}/razz/create_virtual_account/2026-09-22.log   (outbound)
//	{LOG_PATH}/webhooks/razz/2026-09-22.log                  (inbound)
//
// Deliberately does not use the stdlib "log" package's global logger
// (log.SetOutput) — concurrent goroutines writing through the same global
// logger can clobber each other's destination file, so any one channel's
// entries can silently end up missing or in the wrong file. Each
// (namespace, operation) pair here gets its own *os.File + *log.Logger,
// opened lazily and rotated to a new file at midnight.
package requestlog

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// basePath is set once at boot via Init — see main.go. Defaults to
// "./storage/logs" so logging still works (relative to the process's
// working directory) even if Init is never called.
var basePath = "./storage/logs"

// Init sets the log root from config.Cfg.LogPath. Called once at startup,
// before any request/webhook could plausibly be logged.
func Init(path string) {
	if path != "" {
		basePath = path
	}
}

type dailyLogger struct {
	mu    sync.Mutex
	files map[string]*dailyLogFile
}

type dailyLogFile struct {
	day    string
	file   *os.File
	logger *log.Logger
}

var registry = &dailyLogger{files: make(map[string]*dailyLogFile)}

// writer returns today's logger for the given relative directory (e.g.
// "razz/create_virtual_account" or "webhooks/razz"), opening or rotating to
// the day's file as needed. Falls back to stderr if the directory/file
// can't be opened, so a filesystem hiccup never turns into a lost log entry
// or a panic.
func (l *dailyLogger) writer(relDir string) *log.Logger {
	l.mu.Lock()
	defer l.mu.Unlock()

	today := time.Now().Format("2006-01-02")
	if lf, ok := l.files[relDir]; ok && lf.day == today {
		return lf.logger
	}

	dir := filepath.Join(basePath, relDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return log.New(os.Stderr, fmt.Sprintf("[%s] ", relDir), log.LstdFlags|log.Lmicroseconds)
	}

	path := filepath.Join(dir, today+".log")
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
	if err != nil {
		return log.New(os.Stderr, fmt.Sprintf("[%s] ", relDir), log.LstdFlags|log.Lmicroseconds)
	}

	if old, ok := l.files[relDir]; ok && old.file != nil {
		old.file.Close()
	}
	lf := &dailyLogFile{
		day:    today,
		file:   file,
		logger: log.New(file, "", log.LstdFlags|log.Lmicroseconds),
	}
	l.files[relDir] = lf
	return lf.logger
}

// sensitiveHeaders are masked before logging so secrets (API keys, webhook
// signatures) never sit in plaintext on disk.
var sensitiveHeaders = map[string]bool{
	"authorization":    true,
	"x-razz-signature": true,
	"cookie":           true,
}

func maskValue(v string) string {
	if len(v) <= 6 {
		return "***"
	}
	return "***" + v[len(v)-6:]
}

func maskHeaders(h http.Header) map[string]string {
	out := make(map[string]string, len(h))
	for k, v := range h {
		val := strings.Join(v, ", ")
		if sensitiveHeaders[strings.ToLower(k)] {
			val = maskValue(val)
		}
		out[k] = val
	}
	return out
}

func prettyJSON(v interface{}) string {
	if v == nil {
		return "(none)"
	}
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Sprintf("%v", v)
	}
	return string(b)
}

func prettyBody(body []byte) string {
	if len(body) == 0 {
		return "(empty)"
	}
	var buf bytes.Buffer
	if err := json.Indent(&buf, body, "", "  "); err != nil {
		return string(body)
	}
	return buf.String()
}

// LogCall writes one complete, human-readable record of a single outbound
// round-trip to a third party — request and response together, so a
// failure can be diagnosed from one block instead of correlating separate
// lines. namespace/operation together form the log subdirectory (e.g.
// "razz"/"create_virtual_account"), so both must be filesystem-safe.
func LogCall(namespace, operation, method, url string, headers, body interface{}, status int, respBody string, duration time.Duration, callErr error) {
	entry := fmt.Sprintf(
		"\n================ %s | %s ================\n"+
			"%s %s\n"+
			"Duration: %s\n"+
			"Request headers: %s\n"+
			"Request body: %s\n"+
			"Response status: %d\n"+
			"Response body: %s\n",
		operation,
		time.Now().Format(time.RFC3339),
		method, url,
		duration,
		prettyJSON(headers),
		prettyJSON(body),
		status,
		respBody,
	)
	if callErr != nil {
		entry += fmt.Sprintf("Error: %v\n", callErr)
	}
	registry.writer(filepath.Join(namespace, operation)).Print(entry)
}

// LogWebhook writes one complete, human-readable record of an inbound
// webhook call — request (including headers) and outcome together.
// namespace forms the log subdirectory under "webhooks" (e.g. "razz"), so
// it must be filesystem-safe.
func LogWebhook(namespace, method, path string, headers http.Header, body []byte, status int, response interface{}) {
	entry := fmt.Sprintf(
		"\n================ %s | %s ================\n"+
			"%s %s\n"+
			"Request headers: %s\n"+
			"Request body: %s\n"+
			"Response status: %d\n"+
			"Response body: %s\n",
		namespace,
		time.Now().Format(time.RFC3339),
		method, path,
		prettyJSON(maskHeaders(headers)),
		prettyBody(body),
		status,
		prettyJSON(response),
	)
	registry.writer(filepath.Join("webhooks", namespace)).Print(entry)
}
