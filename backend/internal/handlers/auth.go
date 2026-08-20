package handlers

import (
	"net/http"
	"strings"
	"time"

	"frontline-college/backend/internal/auth"
	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/mail"
	"frontline-college/backend/internal/models"
	"frontline-college/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

type ApplyRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Phone     string `json:"phone" binding:"required"`

	ProgramID uint `json:"programId" binding:"required"`

	DateOfBirth   string `json:"dateOfBirth" binding:"required"`
	Gender        string `json:"gender" binding:"required"`
	Address       string `json:"address" binding:"required"`
	StateOfOrigin string `json:"stateOfOrigin" binding:"required"`
	GuardianName  string `json:"guardianName" binding:"required"`
	GuardianPhone string `json:"guardianPhone" binding:"required"`

	SchoolAttended    string `json:"schoolAttended" binding:"required"`
	QualificationType string `json:"qualificationType" binding:"required"`
	ExamType          string `json:"examType" binding:"required"`
	ExamNumber        string `json:"examNumber" binding:"required"`
	Subjects          string `json:"subjects"`
}

// Apply is the public "online application form" endpoint. It's intentionally
// free of any payment gate — submission never requires a fee. It creates (or
// reuses) a student login, records the application, and immediately returns
// a session token so the applicant lands straight in their portal.
func Apply(c *gin.Context) {
	var req ApplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var program models.Program
	if err := db.DB.First(&program, req.ProgramID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "selected program does not exist"})
		return
	}

	var student models.Student
	isNewStudent := false
	err := db.DB.Where("email = ?", req.Email).First(&student).Error
	if err != nil {
		hash, herr := auth.HashPassword(req.Password)
		if herr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process password"})
			return
		}
		student = models.Student{
			Email:        req.Email,
			PasswordHash: hash,
			FirstName:    req.FirstName,
			LastName:     req.LastName,
			Phone:        req.Phone,
		}
		if err := db.DB.Create(&student).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create your account"})
			return
		}
		isNewStudent = true
	} else {
		if !auth.CheckPassword(student.PasswordHash, req.Password) {
			c.JSON(http.StatusConflict, gin.H{"error": "an account with this email already exists. Please log in to continue or check your application status."})
			return
		}
	}

	// One active application per student in the current scope.
	var existing models.Application
	if err := db.DB.Where("student_id = ?", student.ID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "you already have an application on file. Please log in to view its status.", "applicationNumber": existing.ApplicationNumber})
		return
	}

	application := models.Application{
		ApplicationNumber: utils.GenerateApplicationNumber(),
		StudentID:         student.ID,
		ProgramID:         req.ProgramID,
		Status:            models.StatusSubmitted,
		DateOfBirth:       req.DateOfBirth,
		Gender:            req.Gender,
		Address:           req.Address,
		StateOfOrigin:     req.StateOfOrigin,
		GuardianName:      req.GuardianName,
		GuardianPhone:     req.GuardianPhone,
		SchoolAttended:    req.SchoolAttended,
		QualificationType: req.QualificationType,
		ExamType:          req.ExamType,
		ExamNumber:        req.ExamNumber,
		Subjects:          req.Subjects,
		SubmittedAt:       time.Now(),
	}
	if err := db.DB.Create(&application).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not submit application"})
		return
	}

	token, err := auth.IssueToken(student.ID, auth.RoleStudent, student.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "application saved but session could not be created, please log in"})
		return
	}

	cfg := config.Cfg
	body := "<p>Dear " + student.FirstName + ",</p>" +
		"<p>Thank you for applying to <strong>" + program.Name + "</strong> at Frontline College of Health Sciences and Technology.</p>" +
		"<p>Your application number is <strong>" + application.ApplicationNumber + "</strong>. Applying is completely free — no payment is required to submit. " +
		"To move your application forward, please log in to your applicant portal, review the application fee account details, and upload proof of payment.</p>"
	if isNewStudent {
		body += "<p>You can log in any time with the email and password you used to apply.</p>"
	}
	mail.Async(student.Email, student.FirstName, "Application received — "+application.ApplicationNumber, mail.WrapTemplate("Application Received", body))

	_ = cfg
	c.JSON(http.StatusCreated, gin.H{
		"token":             token,
		"applicationNumber": application.ApplicationNumber,
	})
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func StudentLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var student models.Student
	if err := db.DB.Where("email = ?", strings.ToLower(strings.TrimSpace(req.Email))).First(&student).Error; err != nil || !auth.CheckPassword(student.PasswordHash, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	token, err := auth.IssueToken(student.ID, auth.RoleStudent, student.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create session"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token, "firstName": student.FirstName})
}

func AdminLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var admin models.Admin
	if err := db.DB.Where("email = ?", strings.ToLower(strings.TrimSpace(req.Email))).First(&admin).Error; err != nil || !auth.CheckPassword(admin.PasswordHash, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	token, err := auth.IssueToken(admin.ID, auth.RoleAdmin, admin.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create session"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token, "name": admin.Name})
}
