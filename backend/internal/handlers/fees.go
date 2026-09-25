package handlers

import (
	"net/http"

	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// schoolFeeItemsForProgram returns a program's itemized school-fee
// breakdown, in display order.
func schoolFeeItemsForProgram(programID uint) []models.SchoolFeeItem {
	var items []models.SchoolFeeItem
	db.DB.Where("program_id = ?", programID).Order("sort_order, id").Find(&items)
	return items
}

// schoolFeeTotalForProgram is the single source of truth for what a
// program's school fee actually costs — the sum of its itemized breakdown,
// falling back to the global SCHOOL_FEE_AMOUNT default for a program that
// hasn't been seeded/configured with a breakdown yet. Both the school-fee
// payment-proof flow (handlers.UploadSchoolFeeProof) and the Razz virtual
// account flow (handlers.CreateVirtualAccount) call this so neither can
// charge a different amount than what the student is shown.
func schoolFeeTotalForProgram(programID uint) float64 {
	items := schoolFeeItemsForProgram(programID)
	if len(items) == 0 {
		return config.Cfg.SchoolFeeAmount
	}
	var total float64
	for _, item := range items {
		total += item.Amount
	}
	return total
}

// ListFeeStructures returns every program alongside its current school-fee
// breakdown and total, for the admin fee-management screen.
// Route: GET /api/admin/fees
func ListFeeStructures(c *gin.Context) {
	var programs []models.Program
	if err := db.DB.Order("name").Find(&programs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load programs"})
		return
	}

	type feeStructure struct {
		Program models.Program         `json:"program"`
		Items   []models.SchoolFeeItem `json:"items"`
		Total   float64                `json:"total"`
	}

	out := make([]feeStructure, 0, len(programs))
	for _, p := range programs {
		items := schoolFeeItemsForProgram(p.ID)
		var total float64
		for _, item := range items {
			total += item.Amount
		}
		out = append(out, feeStructure{Program: p, Items: items, Total: total})
	}

	c.JSON(http.StatusOK, gin.H{"data": out})
}

type feeItemInput struct {
	Label  string  `json:"label" binding:"required"`
	Amount float64 `json:"amount" binding:"gte=0"`
}

type updateFeeStructureRequest struct {
	Items []feeItemInput `json:"items"`
}

// UpdateFeeStructure replaces a program's entire school-fee breakdown with
// the submitted list — simpler and less error-prone for the admin UI (one
// "save" for the whole table) than tracking individual row IDs across
// add/edit/remove. Runs in a transaction so a partial write never leaves a
// program with a half-updated breakdown.
// Route: PUT /api/admin/fees/:programId
func UpdateFeeStructure(c *gin.Context) {
	var program models.Program
	if err := db.DB.First(&program, c.Param("programId")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
		return
	}

	var req updateFeeStructureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	items := make([]models.SchoolFeeItem, len(req.Items))
	var total float64
	for i, in := range req.Items {
		items[i] = models.SchoolFeeItem{ProgramID: program.ID, Label: in.Label, Amount: in.Amount, SortOrder: i}
		total += in.Amount
	}

	err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("program_id = ?", program.ID).Delete(&models.SchoolFeeItem{}).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			return nil
		}
		return tx.Create(&items).Error
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save fee breakdown"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "fee breakdown updated", "items": items, "total": total})
}
