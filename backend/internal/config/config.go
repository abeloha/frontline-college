// Package config loads and exposes all runtime configuration for the API.
// Every value that could plausibly differ between environments (or that is
// sensitive) lives in .env — nothing operational is hard-coded.
package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv      string
	AppPort     string
	FrontendURL string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	JWTSecret    string
	JWTExpiryHrs int

	SMTPHost      string
	SMTPPort      int
	SMTPUsername  string
	SMTPPassword  string
	SMTPFromName  string
	SMTPFromEmail string

	AdminEmail    string
	AdminPassword string
	AdminName     string

	PaymentBankName      string
	PaymentAccountName   string
	PaymentAccountNumber string
	PaymentCurrency      string
	ApplicationFeeAmount float64
	SchoolFeeAmount      float64

	// Payment methods offered to a student — independently togglable so
	// either can be turned off without redeploying code (e.g. Manual can be
	// switched off once Razz is trusted, or Razz switched off if its
	// integration needs to pause). See docs/payment-collection-api.md for
	// what the Razz fields below come from.
	ManualPaymentEnabled bool
	RazzPaymentEnabled   bool
	RazzAPIBaseURL       string
	RazzAPIKey           string
	RazzWebhookSecret    string

	UploadDir   string
	MaxUploadMB int64

	// LogPath is where every request/response to a third-party API (Razz,
	// ...) and every inbound webhook gets written, one file per calendar
	// day — see internal/requestlog. Mirrors the Razz API's own LOG_PATH
	// convention.
	LogPath string
}

var Cfg *Config

func Load() *Config {
	// It's fine if .env doesn't exist (e.g. in containers where env vars are
	// injected directly) — we just fall back to process env / defaults.
	if err := godotenv.Load(); err != nil {
		log.Println("config: no .env file found, relying on process environment")
	}

	Cfg = &Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		AppPort:     getEnv("APP_PORT", "8080"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),

		DBHost:     getEnv("DB_HOST", "127.0.0.1"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "frontline"),
		DBPassword: getEnv("DB_PASSWORD", "frontline_pw"),
		DBName:     getEnv("DB_NAME", "frontline_college"),

		JWTSecret:    getEnv("JWT_SECRET", "insecure-dev-secret-change-me"),
		JWTExpiryHrs: getEnvInt("JWT_EXPIRY_HOURS", 72),

		SMTPHost:      getEnv("SMTP_HOST", ""),
		SMTPPort:      getEnvInt("SMTP_PORT", 587),
		SMTPUsername:  getEnv("SMTP_USERNAME", ""),
		SMTPPassword:  getEnv("SMTP_PASSWORD", ""),
		SMTPFromName:  getEnv("SMTP_FROM_NAME", "Frontline College of Medical and Health Sciences"),
		SMTPFromEmail: getEnv("SMTP_FROM_EMAIL", "admissions@frontlinecollege.edu.ng"),

		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@frontlinecollege.edu.ng"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "ChangeMe123!"),
		AdminName:     getEnv("ADMIN_NAME", "Admissions Office"),

		PaymentBankName:      getEnv("PAYMENT_BANK_NAME", "Zenith Bank Plc"),
		PaymentAccountName:   getEnv("PAYMENT_ACCOUNT_NAME", "Frontline College of Medical and Health Sciences"),
		PaymentAccountNumber: getEnv("PAYMENT_ACCOUNT_NUMBER", "1234567890"),
		PaymentCurrency:      getEnv("PAYMENT_CURRENCY", "NGN"),
		ApplicationFeeAmount: getEnvFloat("APPLICATION_FEE_AMOUNT", 5000),
		SchoolFeeAmount:      getEnvFloat("SCHOOL_FEE_AMOUNT", 180000),

		ManualPaymentEnabled: getEnvBool("MANUAL_PAYMENT_ENABLED", true),
		RazzPaymentEnabled:   getEnvBool("RAZZ_PAYMENT_ENABLED", false),
		RazzAPIBaseURL:       getEnv("RAZZ_API_BASE_URL", ""),
		RazzAPIKey:           getEnv("RAZZ_API_KEY", ""),
		RazzWebhookSecret:    getEnv("RAZZ_WEBHOOK_SECRET", ""),

		UploadDir:   getEnv("UPLOAD_DIR", "./uploads"),
		MaxUploadMB: int64(getEnvInt("MAX_UPLOAD_MB", 5)),

		LogPath: getEnv("LOG_PATH", "./storage/logs"),
	}

	return Cfg
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return fallback
}
