package db

import (
	"fmt"
	"log"
	"os"
	"time"

	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect opens the MySQL connection and runs AutoMigrate for every model.
func Connect(cfg *config.Config) *gorm.DB {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	// "record not found" is an expected, handled outcome throughout this
	// codebase (e.g. seed lookups, "does this student already have an
	// application" checks) — don't let GORM log it as a warning/error.
	gormLogger := logger.New(log.New(os.Stdout, "\r\n", log.LstdFlags), logger.Config{
		SlowThreshold:             200 * time.Millisecond,
		LogLevel:                  logger.Warn,
		IgnoreRecordNotFoundError: true,
	})

	conn, err := gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: gormLogger})
	if err != nil {
		log.Fatalf("db: failed to connect: %v", err)
	}

	if err := conn.AutoMigrate(
		&models.Program{},
		&models.Student{},
		&models.Application{},
		&models.PaymentProof{},
		&models.VirtualAccount{},
		&models.AdmissionLetter{},
		&models.SchoolFeeItem{},
		&models.Notice{},
		&models.Admin{},
	); err != nil {
		log.Fatalf("db: automigrate failed: %v", err)
	}

	DB = conn
	log.Println("db: connected and migrated")
	return conn
}
