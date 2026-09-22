package handlers

import (
	"net/http"
	"path/filepath"
	"strings"

	"frontline-college/backend/internal/auth"
	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/middleware"
	"frontline-college/backend/internal/models"

	"github.com/gin-gonic/gin"
)

// ServeFile streams an uploaded payment proof, admission letter or notice
// attachment after confirming the requester owns it (students) or is staff
// (admin). Files are never served anonymously, since proofs of payment are
// sensitive.
func ServeFile(c *gin.Context) {
	claims := middleware.GetClaims(c)
	relPath := strings.TrimPrefix(c.Param("path"), "/")

	var appID uint
	var found bool

	var proof models.PaymentProof
	if err := db.DB.Where("file_path = ?", relPath).First(&proof).Error; err == nil {
		appID = proof.ApplicationID
		found = true
	}
	if !found {
		var letter models.AdmissionLetter
		if err := db.DB.Where("file_path = ?", relPath).First(&letter).Error; err == nil {
			appID = letter.ApplicationID
			found = true
		}
	}
	if !found {
		var notice models.Notice
		if err := db.DB.Where("file_path = ?", relPath).First(&notice).Error; err == nil {
			if !canViewNoticeFile(claims, &notice) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you do not have access to this file"})
				return
			}
			c.File(filepath.Join(config.Cfg.UploadDir, relPath))
			return
		}
	}
	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	if claims.Role != auth.RoleAdmin {
		var app models.Application
		if err := db.DB.First(&app, appID).Error; err != nil || app.StudentID != claims.UserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "you do not have access to this file"})
			return
		}
	}

	full := filepath.Join(config.Cfg.UploadDir, relPath)
	c.File(full)
}

// canViewNoticeFile mirrors the visibility rules in ListStudentNotices — an
// admin can see any attachment, a student only one that is live and either
// unscoped or scoped to their own application's program.
func canViewNoticeFile(claims *auth.Claims, notice *models.Notice) bool {
	if claims.Role == auth.RoleAdmin {
		return true
	}
	if !notice.IsLive() {
		return false
	}
	if notice.ProgramID == nil {
		return true
	}
	var app models.Application
	if err := db.DB.Where("student_id = ?", claims.UserID).First(&app).Error; err != nil {
		return false
	}
	return app.ProgramID == *notice.ProgramID
}
