package handlers

import (
	"net/http"

	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/models"

	"github.com/gin-gonic/gin"
)

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "frontline-college-api"})
}

func ListPrograms(c *gin.Context) {
	var programs []models.Program
	if err := db.DB.Order("category, name").Find(&programs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load programs"})
		return
	}
	c.JSON(http.StatusOK, programs)
}

func GetProgram(c *gin.Context) {
	slug := c.Param("slug")
	var program models.Program
	if err := db.DB.Where("slug = ?", slug).First(&program).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
		return
	}
	c.JSON(http.StatusOK, program)
}
