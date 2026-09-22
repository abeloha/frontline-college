package handlers

import (
	"net/http"
	"time"

	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/mail"
	"frontline-college/backend/internal/middleware"
	"frontline-college/backend/internal/models"
	"frontline-college/backend/internal/razz"
	"frontline-college/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func fileURL(relPath string) string {
	if relPath == "" {
		return ""
	}
	return "/api/files/" + relPath
}

func hydrateApplicationFileURLs(app *models.Application) {
	for i := range app.PaymentProofs {
		app.PaymentProofs[i].FileURL = fileURL(app.PaymentProofs[i].FilePath)
	}
	if app.AdmissionLetter != nil {
		app.AdmissionLetter.FileURL = fileURL(app.AdmissionLetter.FilePath)
	}
}

func Me(c *gin.Context) {
	claims := middleware.GetClaims(c)
	var student models.Student
	if err := db.DB.First(&student, claims.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
		return
	}
	c.JSON(http.StatusOK, student)
}

func getOwnApplication(c *gin.Context) (*models.Application, bool) {
	claims := middleware.GetClaims(c)
	var app models.Application
	err := db.DB.Preload("Program").Preload("Student").Preload("PaymentProofs").
		Preload("VirtualAccounts", func(db *gorm.DB) *gorm.DB { return db.Order("created_at DESC") }).
		Preload("AdmissionLetter").
		Where("student_id = ?", claims.UserID).First(&app).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no application found on your account"})
		return nil, false
	}
	return &app, true
}

// MyApplication returns the applicant's full application status, including
// the (configurable) bank account details they should pay fees into.
func MyApplication(c *gin.Context) {
	app, ok := getOwnApplication(c)
	if !ok {
		return
	}
	hydrateApplicationFileURLs(app)

	cfg := config.Cfg
	c.JSON(http.StatusOK, gin.H{
		"application": app,
		"paymentInfo": gin.H{
			"bankName":             cfg.PaymentBankName,
			"accountName":          cfg.PaymentAccountName,
			"accountNumber":        cfg.PaymentAccountNumber,
			"currency":             cfg.PaymentCurrency,
			"applicationFeeAmount": cfg.ApplicationFeeAmount,
			"schoolFeeAmount":      cfg.SchoolFeeAmount,
			"paymentMethods": gin.H{
				"manual": cfg.ManualPaymentEnabled,
				"razz":   cfg.RazzPaymentEnabled,
			},
		},
	})
}

var applicationFeeUploadableStatuses = map[string]bool{
	models.StatusSubmitted: true,
}

// UploadApplicationFeeProof lets the student attach proof of payment for the
// (optional, non-blocking) application fee. Allowed once, while status is
// still "submitted"; a rejected proof resets status back to "submitted" so
// they can retry.
func UploadApplicationFeeProof(c *gin.Context) {
	app, ok := getOwnApplication(c)
	if !ok {
		return
	}
	if !applicationFeeUploadableStatuses[app.Status] {
		c.JSON(http.StatusConflict, gin.H{"error": "application fee proof cannot be uploaded at this stage"})
		return
	}
	handleProofUpload(c, app, models.PaymentTypeApplicationFee, "application_fee", "payments", config.Cfg.ApplicationFeeAmount, models.StatusApplicationFeeReview)
}

var schoolFeeUploadableStatuses = map[string]bool{
	models.StatusAdmissionAccepted: true,
}

// UploadSchoolFeeProof lets a student who has accepted their admission
// offer attach proof of school fee payment.
func UploadSchoolFeeProof(c *gin.Context) {
	app, ok := getOwnApplication(c)
	if !ok {
		return
	}
	if !schoolFeeUploadableStatuses[app.Status] {
		c.JSON(http.StatusConflict, gin.H{"error": "you can only upload school fee proof after accepting your admission offer"})
		return
	}
	handleProofUpload(c, app, models.PaymentTypeSchoolFee, "school_fee", "school_fees", config.Cfg.SchoolFeeAmount, models.StatusSchoolFeeReview)
}

func handleProofUpload(c *gin.Context, app *models.Application, proofType, logLabel, subdir string, amount float64, nextStatus string) {
	if pending := findPendingVirtualAccount(app.ID, proofType); pending != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "an automatic payment is already in progress for this fee — wait for it to complete or expire before uploading proof manually"})
		return
	}

	cfg := config.Cfg
	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "please attach a payment proof file"})
		return
	}
	relPath, err := utils.SaveUpload(fh, cfg.UploadDir, subdir, cfg.MaxUploadMB)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	proof := models.PaymentProof{
		ApplicationID: app.ID,
		Type:          proofType,
		FilePath:      relPath,
		Amount:        amount,
		Status:        models.PaymentStatusPending,
		UploadedAt:    time.Now(),
	}

	if err := db.DB.Create(&proof).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save payment proof"})
		return
	}
	if err := db.DB.Model(&models.Application{}).Where("id = ?", app.ID).Update("status", nextStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "proof saved but status update failed"})
		return
	}

	proof.FileURL = fileURL(proof.FilePath)
	c.JSON(http.StatusOK, gin.H{"message": logLabel + " proof uploaded, pending review", "proof": proof})
}

// AcceptAdmission lets an accepted student confirm they are taking their
// offer, unlocking the school-fee upload step.
func AcceptAdmission(c *gin.Context) {
	app, ok := getOwnApplication(c)
	if !ok {
		return
	}
	if app.Status != models.StatusAccepted {
		c.JSON(http.StatusConflict, gin.H{"error": "admission can only be accepted once your application has been accepted"})
		return
	}
	now := time.Now()
	if err := db.DB.Model(&models.Application{}).Where("id = ?", app.ID).Updates(map[string]any{
		"status":                models.StatusAdmissionAccepted,
		"admission_accepted_at": now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not record admission acceptance"})
		return
	}

	var student models.Student
	db.DB.First(&student, app.StudentID)
	body := "<p>Dear " + student.FirstName + ",</p><p>We're delighted you're joining us! Your admission acceptance has been recorded. " +
		"Please log in to your portal to view the school fee account details and upload your proof of payment to complete enrollment.</p>"
	mail.Async(student.Email, student.FirstName, "Admission acceptance confirmed", mail.WrapTemplate("Admission Accepted", body))

	c.JSON(http.StatusOK, gin.H{"message": "admission accepted"})
}

// findPendingVirtualAccount returns this application's currently pending,
// unexpired virtual account for proofType, if any — used both to make
// CreateVirtualAccount idempotent (don't mint a second disposable account
// while one is still open) and to block a manual upload while an automatic
// payment is in flight (see handleProofUpload).
func findPendingVirtualAccount(applicationID uint, proofType string) *models.VirtualAccount {
	var va models.VirtualAccount
	err := db.DB.Where("application_id = ? AND type = ? AND status = ? AND expires_at > ?",
		applicationID, proofType, models.VAStatusPending, time.Now()).
		Order("created_at desc").First(&va).Error
	if err != nil {
		return nil
	}
	return &va
}

// uploadableStatusesFor returns the same stage gate handleProofUpload uses
// for a given fee type, so CreateVirtualAccount enforces identical rules
// about when each fee can be paid (once a manual proof moves the
// application into a *_review status, both paths close together).
func uploadableStatusesFor(proofType string) map[string]bool {
	if proofType == models.PaymentTypeApplicationFee {
		return applicationFeeUploadableStatuses
	}
	return schoolFeeUploadableStatuses
}

type virtualAccountRequest struct {
	Type string `json:"type" binding:"required,oneof=application_fee school_fee"`
}

// CreateVirtualAccount issues (or returns the already-open) Razz virtual
// account for one fee type on the caller's own application.
// Route: POST /api/student/application/virtual-account
func CreateVirtualAccount(c *gin.Context) {
	cfg := config.Cfg
	if !cfg.RazzPaymentEnabled {
		c.JSON(http.StatusNotFound, gin.H{"error": "automatic payment is not available"})
		return
	}

	app, ok := getOwnApplication(c)
	if !ok {
		return
	}

	var req virtualAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !uploadableStatusesFor(req.Type)[app.Status] {
		c.JSON(http.StatusConflict, gin.H{"error": "this fee cannot be paid at this stage"})
		return
	}

	if existing := findPendingVirtualAccount(app.ID, req.Type); existing != nil {
		c.JSON(http.StatusOK, gin.H{"virtualAccount": existing})
		return
	}

	amount := cfg.ApplicationFeeAmount
	label := "Application fee"
	if req.Type == models.PaymentTypeSchoolFee {
		amount = cfg.SchoolFeeAmount
		label = "School fee"
	}

	var student models.Student
	db.DB.First(&student, app.StudentID)

	result, err := razz.CreateVirtualAccount(cfg, razz.CreateVirtualAccountInput{
		AmountKobo:        int64(amount * 100),
		CustomerReference: app.ApplicationNumber + "-" + req.Type,
		Description:       label + " — " + app.ApplicationNumber,
		PayerName:         student.FirstName + " " + student.LastName,
		PayerEmail:        student.Email,
	})
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "could not create virtual account, please try again shortly"})
		return
	}

	va := models.VirtualAccount{
		ApplicationID: app.ID,
		Type:          req.Type,
		Reference:     result.Reference,
		AccountNumber: result.AccountNumber,
		BankName:      result.BankName,
		Amount:        amount,
		Status:        models.VAStatusPending,
		ExpiresAt:     result.ExpiresAt,
	}
	if err := db.DB.Create(&va).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "virtual account created but failed to save — contact support"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"virtualAccount": va})
}

// GetVirtualAccount returns the caller's latest virtual account for a given
// fee type — a pure read of local state. Only the Razz webhook
// (RazzWebhookHandler) ever changes it; this exists so the portal can poll
// for the moment it flips to "paid" without needing a live round trip to
// Razz. Route: GET /api/student/application/virtual-account?type=...
func GetVirtualAccount(c *gin.Context) {
	app, ok := getOwnApplication(c)
	if !ok {
		return
	}

	vaType := c.Query("type")
	if vaType != models.PaymentTypeApplicationFee && vaType != models.PaymentTypeSchoolFee {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or missing type"})
		return
	}

	var va models.VirtualAccount
	if err := db.DB.Where("application_id = ? AND type = ?", app.ID, vaType).
		Order("created_at desc").First(&va).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no virtual account found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"virtualAccount": va})
}
