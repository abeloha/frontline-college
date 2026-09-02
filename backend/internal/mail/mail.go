// Package mail wraps go-mail for transactional notifications. When
// SMTP_HOST is unset (typical for local dev) it logs the email instead of
// sending it, so the rest of the app works without SMTP credentials.
package mail

import (
	"fmt"
	"log"

	"frontline-college/backend/internal/config"

	gomail "github.com/wneessen/go-mail"
)

func Send(toEmail, toName, subject, htmlBody string) {
	cfg := config.Cfg

	if cfg.SMTPHost == "" {
		log.Printf("mail: [dev-mode, not sent] to=%s subject=%q\n%s\n", toEmail, subject, htmlBody)
		return
	}

	msg := gomail.NewMsg()
	if err := msg.FromFormat(cfg.SMTPFromName, cfg.SMTPFromEmail); err != nil {
		log.Printf("mail: failed to set from: %v", err)
		return
	}
	if err := msg.AddToFormat(toName, toEmail); err != nil {
		log.Printf("mail: failed to set to: %v", err)
		return
	}
	msg.Subject(subject)
	msg.SetBodyString(gomail.TypeTextHTML, htmlBody)

	client, err := gomail.NewClient(cfg.SMTPHost,
		gomail.WithPort(cfg.SMTPPort),
		gomail.WithSMTPAuth(gomail.SMTPAuthPlain),
		gomail.WithUsername(cfg.SMTPUsername),
		gomail.WithPassword(cfg.SMTPPassword),
		gomail.WithTLSPolicy(gomail.TLSOpportunistic),
	)
	if err != nil {
		log.Printf("mail: client setup failed: %v", err)
		return
	}

	if err := client.DialAndSend(msg); err != nil {
		log.Printf("mail: send failed to %s: %v", toEmail, err)
		return
	}
	log.Printf("mail: sent %q to %s", subject, toEmail)
}

// Async fires Send in a goroutine so request handlers never block on SMTP.
func Async(toEmail, toName, subject, htmlBody string) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("mail: recovered panic sending mail: %v", r)
			}
		}()
		Send(toEmail, toName, subject, htmlBody)
	}()
}

func WrapTemplate(title, bodyHTML string) string {
	return fmt.Sprintf(`<!doctype html>
<html>
<body style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f2f6fb; padding:32px; color:#0b1f3a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0a3d91;padding:20px 28px;">
      <span style="color:#fff;font-size:16px;font-weight:700;letter-spacing:.02em;">Frontline College of Medical and Health Sciences</span>
    </div>
    <div style="padding:28px;">
      <h2 style="margin-top:0;color:#0a3d91;">%s</h2>
      %s
      <p style="margin-top:32px;font-size:12px;color:#64748b;">Chikuku Community, Kuje Area Council, FCT Abuja &middot; frontlinehealthtech@gmail.com</p>
    </div>
  </div>
</body>
</html>`, title, bodyHTML)
}
