package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/middleware"
	"frontline-college/backend/internal/models"
	"frontline-college/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func hydrateNoticeFileURL(n *models.Notice) {
	n.FileURL = fileURL(n.FilePath)
}

// noticeForm reads the shared multipart fields for creating/updating a
// Notice. It returns ok=false (and has already written the error response)
// if anything fails validation.
type noticeForm struct {
	Title     string
	Body      string
	Category  string
	ProgramID *uint
	Pinned    bool
	Published bool
	ExpiresAt *time.Time
}

func parseNoticeForm(c *gin.Context, requireTitle bool) (noticeForm, bool) {
	var f noticeForm
	f.Title = c.PostForm("title")
	f.Body = c.PostForm("body")
	f.Category = c.DefaultPostForm("category", models.NoticeCategoryGeneral)
	f.Pinned = c.PostForm("pinned") == "true"
	f.Published = c.DefaultPostForm("published", "true") == "true"

	if requireTitle && f.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return f, false
	}
	if !models.NoticeCategories[f.Category] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category"})
		return f, false
	}
	if pid := c.PostForm("programId"); pid != "" {
		id, err := strconv.ParseUint(pid, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid programId"})
			return f, false
		}
		v := uint(id)
		f.ProgramID = &v
	}
	if exp := c.PostForm("expiresAt"); exp != "" {
		t, err := time.Parse("2006-01-02", exp)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "expiresAt must be YYYY-MM-DD"})
			return f, false
		}
		// End-of-day so a notice stays visible through the date an admin picked.
		t = t.Add(23*time.Hour + 59*time.Minute)
		f.ExpiresAt = &t
	}
	return f, true
}

// ListNotices returns every notice (draft and published) for the admin
// noticeboard manager, newest first.
func ListNotices(c *gin.Context) {
	query := db.DB.Model(&models.Notice{}).Preload("Program")
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if programID := c.Query("programId"); programID != "" {
		query = query.Where("program_id = ?", programID)
	}

	var notices []models.Notice
	if err := query.Order("pinned DESC, created_at DESC").Find(&notices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load notices"})
		return
	}
	for i := range notices {
		hydrateNoticeFileURL(&notices[i])
	}
	c.JSON(http.StatusOK, gin.H{"data": notices})
}

// CreateNotice publishes a new noticeboard post, with an optional file
// attachment (e.g. a placement schedule PDF).
func CreateNotice(c *gin.Context) {
	claims := middleware.GetClaims(c)
	f, ok := parseNoticeForm(c, true)
	if !ok {
		return
	}

	notice := models.Notice{
		Title:       f.Title,
		Body:        f.Body,
		Category:    f.Category,
		ProgramID:   f.ProgramID,
		Pinned:      f.Pinned,
		Published:   f.Published,
		PublishedAt: time.Now(),
		ExpiresAt:   f.ExpiresAt,
		CreatedBy:   claims.UserID,
	}

	if fh, err := c.FormFile("file"); err == nil {
		relPath, err := utils.SaveUpload(fh, config.Cfg.UploadDir, "notices", config.Cfg.MaxUploadMB)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		notice.FilePath = relPath
	}

	if err := db.DB.Create(&notice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create notice"})
		return
	}

	hydrateNoticeFileURL(&notice)
	c.JSON(http.StatusOK, gin.H{"message": "notice published", "notice": notice})
}

// UpdateNotice edits an existing notice's fields, optionally replacing its
// attachment (the old file is deleted from disk once the new one is saved).
func UpdateNotice(c *gin.Context) {
	var notice models.Notice
	if err := db.DB.First(&notice, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "notice not found"})
		return
	}

	f, ok := parseNoticeForm(c, true)
	if !ok {
		return
	}

	updates := map[string]any{
		"title":      f.Title,
		"body":       f.Body,
		"category":   f.Category,
		"program_id": f.ProgramID,
		"pinned":     f.Pinned,
		"published":  f.Published,
		"expires_at": f.ExpiresAt,
	}

	if fh, err := c.FormFile("file"); err == nil {
		relPath, err := utils.SaveUpload(fh, config.Cfg.UploadDir, "notices", config.Cfg.MaxUploadMB)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		oldPath := notice.FilePath
		updates["file_path"] = relPath
		if oldPath != "" {
			os.Remove(filepath.Join(config.Cfg.UploadDir, oldPath))
		}
	}

	if err := db.DB.Model(&notice).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update notice"})
		return
	}

	db.DB.Preload("Program").First(&notice, notice.ID)
	hydrateNoticeFileURL(&notice)
	c.JSON(http.StatusOK, gin.H{"message": "notice updated", "notice": notice})
}

// DeleteNotice removes a notice and best-effort deletes its attachment.
func DeleteNotice(c *gin.Context) {
	var notice models.Notice
	if err := db.DB.First(&notice, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "notice not found"})
		return
	}
	if err := db.DB.Delete(&notice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete notice"})
		return
	}
	if notice.FilePath != "" {
		os.Remove(filepath.Join(config.Cfg.UploadDir, notice.FilePath))
	}
	c.JSON(http.StatusOK, gin.H{"message": "notice deleted"})
}

// ListStudentNotices returns the notices visible to the caller: every
// unscoped (ProgramID nil) live notice, plus any scoped to the program of
// the student's own application. A student without an application yet
// (shouldn't normally reach the portal, but the endpoint shouldn't 500 if
// they do) simply sees the unscoped ones.
func ListStudentNotices(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var app models.Application
	hasApp := db.DB.Where("student_id = ?", claims.UserID).First(&app).Error == nil

	query := db.DB.Model(&models.Notice{}).Preload("Program").
		Where("published = ?", true).
		Where("expires_at IS NULL OR expires_at > ?", time.Now())

	if hasApp {
		query = query.Where("program_id IS NULL OR program_id = ?", app.ProgramID)
	} else {
		query = query.Where("program_id IS NULL")
	}

	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}

	var notices []models.Notice
	if err := query.Order("pinned DESC, published_at DESC").Find(&notices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load notices"})
		return
	}
	for i := range notices {
		hydrateNoticeFileURL(&notices[i])
	}
	c.JSON(http.StatusOK, gin.H{"data": notices})
}
