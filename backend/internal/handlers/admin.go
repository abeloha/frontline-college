package handlers

import (
	"net/http"
	"strconv"
	"time"

	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/mail"
	"frontline-college/backend/internal/middleware"
	"frontline-college/backend/internal/models"
	"frontline-college/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// ListApplications supports optional ?status=&programId=&q=&page=&pageSize=
func ListApplications(c *gin.Context) {
	query := db.DB.Model(&models.Application{}).Preload("Program").Preload("Student").Preload("PaymentProofs").Preload("AdmissionLetter")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if programID := c.Query("programId"); programID != "" {
		query = query.Where("program_id = ?", programID)
	}
	if q := c.Query("q"); q != "" {
		like := "%" + q + "%"
		query = query.Joins("JOIN students ON students.id = applications.student_id").
			Where("applications.application_number LIKE ? OR students.email LIKE ? OR students.first_name LIKE ? OR students.last_name LIKE ?", like, like, like, like)
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	query.Count(&total)

	var apps []models.Application
	if err := query.Order("submitted_at desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load applications"})
		return
	}
	for i := range apps {
		hydrateApplicationFileURLs(&apps[i])
	}

	c.JSON(http.StatusOK, gin.H{"data": apps, "total": total, "page": page, "pageSize": pageSize})
}

func GetApplication(c *gin.Context) {
	var app models.Application
	if err := db.DB.Preload("Program").Preload("Student").Preload("PaymentProofs").Preload("AdmissionLetter").
		First(&app, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}
	hydrateApplicationFileURLs(&app)
	c.JSON(http.StatusOK, app)
}

type VerifyPaymentRequest struct {
	ProofID uint   `json:"proofId" binding:"required"`
	Action  string `json:"action" binding:"required,oneof=verify reject"`
	Notes   string `json:"notes"`
}

// VerifyPayment approves or rejects a single payment proof and moves the
// application to the next stage of the pipeline accordingly.
func VerifyPayment(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var app models.Application
	if err := db.DB.First(&app, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	var req VerifyPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var proof models.PaymentProof
	if err := db.DB.Where("id = ? AND application_id = ?", req.ProofID, app.ID).First(&proof).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment proof not found"})
		return
	}

	now := time.Now()
	newProofStatus := models.PaymentStatusRejected
	var newAppStatus string

	if req.Action == "verify" {
		newProofStatus = models.PaymentStatusVerified
		newAppStatus = models.NextStatusAfterVerifiedPayment(proof.Type)
	} else {
		if proof.Type == models.PaymentTypeApplicationFee {
			newAppStatus = models.StatusSubmitted
		} else {
			newAppStatus = models.StatusAdmissionAccepted
		}
	}

	if err := db.DB.Model(&proof).Updates(map[string]any{
		"status":      newProofStatus,
		"notes":       req.Notes,
		"reviewed_at": now,
		"reviewed_by": claims.UserID,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update payment proof"})
		return
	}
	if err := db.DB.Model(&app).Update("status", newAppStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "proof updated but application status change failed"})
		return
	}

	var student models.Student
	db.DB.First(&student, app.StudentID)
	label := "application fee"
	if proof.Type == models.PaymentTypeSchoolFee {
		label = "school fee"
	}
	verb := "verified"
	if req.Action == "reject" {
		verb = "rejected — please re-upload a valid proof of payment"
	}
	body := "<p>Dear " + student.FirstName + ",</p><p>Your " + label + " payment proof for application <strong>" + app.ApplicationNumber + "</strong> has been " + verb + ".</p>"
	mail.Async(student.Email, student.FirstName, "Payment update — "+app.ApplicationNumber, mail.WrapTemplate("Payment Update", body))

	c.JSON(http.StatusOK, gin.H{"message": "payment proof " + req.Action + "ed"})
}

type DecisionRequest struct {
	Action string `json:"action" binding:"required,oneof=accept reject"`
	Reason string `json:"reason"`
}

// Decide accepts or rejects an application that is under_review.
func Decide(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var app models.Application
	if err := db.DB.First(&app, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}
	if app.Status != models.StatusUnderReview {
		c.JSON(http.StatusConflict, gin.H{"error": "only applications under review can be accepted or rejected"})
		return
	}

	var req DecisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newStatus := models.StatusRejected
	if req.Action == "accept" {
		newStatus = models.StatusAccepted
	}

	now := time.Now()
	updates := map[string]any{
		"status":      newStatus,
		"reviewed_at": now,
		"reviewed_by": claims.UserID,
	}
	if req.Action == "reject" {
		updates["rejection_reason"] = req.Reason
	}
	if err := db.DB.Model(&app).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save decision"})
		return
	}

	var student models.Student
	db.DB.First(&student, app.StudentID)
	var body string
	subject := "Application update — " + app.ApplicationNumber
	if req.Action == "accept" {
		body = "<p>Dear " + student.FirstName + ",</p><p>Congratulations! Your application <strong>" + app.ApplicationNumber + "</strong> has been <strong>accepted</strong>. " +
			"Your admission letter will be uploaded to your portal shortly.</p>"
	} else {
		body = "<p>Dear " + student.FirstName + ",</p><p>We regret to inform you that your application <strong>" + app.ApplicationNumber + "</strong> was not successful at this time.</p>"
		if req.Reason != "" {
			body += "<p>Reason: " + req.Reason + "</p>"
		}
	}
	mail.Async(student.Email, student.FirstName, subject, mail.WrapTemplate("Application Decision", body))

	c.JSON(http.StatusOK, gin.H{"message": "decision recorded", "status": newStatus})
}

// UploadAdmissionLetter attaches the admission letter file to an accepted
// application.
func UploadAdmissionLetter(c *gin.Context) {
	claims := middleware.GetClaims(c)
	cfg := config.Cfg

	var app models.Application
	if err := db.DB.First(&app, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}
	if app.Status != models.StatusAccepted {
		c.JSON(http.StatusConflict, gin.H{"error": "admission letters can only be uploaded for accepted applications"})
		return
	}

	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "please attach the admission letter file"})
		return
	}
	relPath, err := utils.SaveUpload(fh, cfg.UploadDir, "admission_letters", cfg.MaxUploadMB)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var letter models.AdmissionLetter
	err = db.DB.Where("application_id = ?", app.ID).First(&letter).Error
	if err == nil {
		db.DB.Model(&letter).Updates(map[string]any{"file_path": relPath, "uploaded_at": time.Now(), "uploaded_by": claims.UserID})
	} else {
		letter = models.AdmissionLetter{ApplicationID: app.ID, FilePath: relPath, UploadedAt: time.Now(), UploadedBy: claims.UserID}
		db.DB.Create(&letter)
	}

	var student models.Student
	db.DB.First(&student, app.StudentID)
	body := "<p>Dear " + student.FirstName + ",</p><p>Your admission letter for <strong>" + app.ApplicationNumber + "</strong> is now available in your portal. " +
		"Log in, download it, and accept your admission to proceed with enrollment.</p>"
	mail.Async(student.Email, student.FirstName, "Your admission letter is ready", mail.WrapTemplate("Admission Letter Ready", body))

	letter.FileURL = fileURL(letter.FilePath)
	c.JSON(http.StatusOK, gin.H{"message": "admission letter uploaded", "admissionLetter": letter})
}

func Stats(c *gin.Context) {
	var total, submitted, underReview, accepted, rejected, enrolled int64
	db.DB.Model(&models.Application{}).Count(&total)
	db.DB.Model(&models.Application{}).Where("status = ?", models.StatusSubmitted).Count(&submitted)
	db.DB.Model(&models.Application{}).Where("status = ?", models.StatusUnderReview).Count(&underReview)
	db.DB.Model(&models.Application{}).Where("status = ?", models.StatusAccepted).Count(&accepted)
	db.DB.Model(&models.Application{}).Where("status = ?", models.StatusRejected).Count(&rejected)
	db.DB.Model(&models.Application{}).Where("status = ?", models.StatusEnrolled).Count(&enrolled)

	c.JSON(http.StatusOK, gin.H{
		"total":       total,
		"submitted":   submitted,
		"underReview": underReview,
		"accepted":    accepted,
		"rejected":    rejected,
		"enrolled":    enrolled,
	})
}
