package main

import (
	"log"
	"os"

	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/db"
	"frontline-college/backend/internal/handlers"
	"frontline-college/backend/internal/seed"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		log.Fatalf("main: could not create upload dir: %v", err)
	}

	gormDB := db.Connect(cfg)
	seed.Run(gormDB, cfg)

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	handlers.RegisterRoutes(r, cfg)

	addr := ":" + cfg.AppPort
	log.Printf("main: listening on %s (env=%s)", addr, cfg.AppEnv)
	if err := r.Run(addr); err != nil {
		log.Fatalf("main: server failed: %v", err)
	}
}
