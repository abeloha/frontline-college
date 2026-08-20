package handlers

import (
	"net/http"
	"time"

	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/mail"
	"frontline-college/backend/internal/middleware"
	"frontline-college/backend/internal/models"
	"frontline-college/backend/internal/utils"

	"github.com/gin-gonic/gin"
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
	err := db.DB.Preload("Program").Preload("Student").Preload("PaymentProofs").Preload("AdmissionLetter").
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
		"status":                 models.StatusAdmissionAccepted,
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
