package handlers

import (
	"frontline-college/backend/internal/auth"
	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, cfg *config.Config) {
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")

	api.GET("/health", Health)
	api.GET("/programs", ListPrograms)
	api.GET("/programs/:slug", GetProgram)

	api.POST("/apply", Apply)
	api.POST("/auth/login", StudentLogin)
	api.POST("/auth/admin/login", AdminLogin)

	api.GET("/files/*path", middleware.RequireAuth(""), ServeFile)

	student := api.Group("/student")
	student.Use(middleware.RequireAuth(auth.RoleStudent))
	{
		student.GET("/me", Me)
		student.GET("/application", MyApplication)
		student.POST("/application/payment-proof", UploadApplicationFeeProof)
		student.POST("/application/accept-admission", AcceptAdmission)
		student.POST("/application/school-fee-proof", UploadSchoolFeeProof)
	}

	admin := api.Group("/admin")
	admin.Use(middleware.RequireAuth(auth.RoleAdmin))
	{
		admin.GET("/stats", Stats)
		admin.GET("/applications", ListApplications)
		admin.GET("/applications/:id", GetApplication)
		admin.POST("/applications/:id/verify-payment", VerifyPayment)
		admin.POST("/applications/:id/decision", Decide)
		admin.POST("/applications/:id/admission-letter", UploadAdmissionLetter)
	}
}
