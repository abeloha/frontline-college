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

// ServeFile streams an uploaded payment proof or admission letter after
// confirming the requester owns it (students) or is staff (admin). Files are
// never served anonymously, since proofs of payment are sensitive.
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
