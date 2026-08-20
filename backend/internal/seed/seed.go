// Package seed populates first-run reference data: the programs on offer
// (drawn from docs/about.md and the college's admission flyer) and the
// default admin account from .env.
package seed

import (
	"log"

	"frontline-college/backend/internal/auth"
	"frontline-college/backend/internal/config"
	"frontline-college/backend/internal/models"

	"gorm.io/gorm"
)

func Run(dbc *gorm.DB, cfg *config.Config) {
	seedPrograms(dbc)
	seedAdmin(dbc, cfg)
}

func seedPrograms(dbc *gorm.DB) {
	programs := []models.Program{
		{
			Slug:          "community-health-extension-workers",
			Name:          "Community Health Extension Workers (CHEW)",
			Category:      "Professional Diploma",
			DurationYears: 3,
			Summary:       "Trains frontline health workers who deliver primary clinical care and drive grassroots health campaigns across underserved communities.",
			CoreDuties:    "Providing essential primary clinical care, conducting maternal and child health services (immunizations, antenatal care, family planning), managing minor illnesses, and coordinating grassroots health campaigns.",
			PlacesOfWork:  "Primary Healthcare Centers (PHCs), local government health departments, general and teaching hospitals, and community-focused NGOs.",
			ImageURL:      "/images/program-chew.jpg",
		},
		{
			Slug:          "retraining-chew",
			Name:          "Retraining Diploma in Community Health Extension Workers (CHEW)",
			Category:      "Professional Diploma",
			DurationYears: 1,
			Summary:       "A refresher and upskilling track for practicing CHEWs to update their clinical knowledge and meet current regulatory standards.",
			CoreDuties:    "Updated primary care protocols, maternal and child health best practices, and modern community health campaign coordination.",
			PlacesOfWork:  "Primary Healthcare Centers (PHCs), local government health departments, general and teaching hospitals.",
			ImageURL:      "/images/program-chew-retraining.jpg",
		},
		{
			Slug:          "junior-chew",
			Name:          "Certificate/Diploma in Junior Community Health Extension Worker (JCHEW)",
			Category:      "Professional Diploma",
			DurationYears: 2,
			Summary:       "An entry-level certificate pathway into community health work, preparing graduates for grassroots primary care roles.",
			CoreDuties:    "Basic primary care support, health education, immunization outreach, and community health data collection.",
			PlacesOfWork:  "Primary Healthcare Centers (PHCs), community outreach programs, NGOs.",
			ImageURL:      "/images/program-jchew.jpg",
		},
		{
			Slug:          "public-health-technicians",
			Name:          "Public Health Technicians (PHT)",
			Category:      "National Diploma",
			DurationYears: 3,
			Summary:       "Prepares public health technicians to diagnose community health needs, manage sanitation safety, and lead disease prevention initiatives.",
			CoreDuties:    "Performing comprehensive community health diagnoses, collecting and evaluating local epidemiologic data, managing water and sanitation safety, and implementing infectious disease prevention initiatives.",
			PlacesOfWork:  "Ministries of Health, environmental protection agencies, waste management and water treatment facilities, corporate health departments, and international public health agencies.",
			ImageURL:      "/images/program-pht.jpg",
		},
		{
			Slug:          "health-education-and-promotion",
			Name:          "Health Education and Promotion (HEP)",
			Category:      "National Diploma",
			DurationYears: 3,
			Summary:       "Equips graduates to design and deliver health education campaigns that build healthier communities through behaviour change.",
			CoreDuties:    "Designing health education materials, running community awareness campaigns, training peer educators, and evaluating public health promotion programs.",
			PlacesOfWork:  "Ministries of Health, hospitals, NGOs, corporate wellness departments, and international health agencies.",
			ImageURL:      "/images/program-hep.jpg",
		},
		{
			Slug:          "environmental-health-technology",
			Name:          "Environmental Health Technology (EHT)",
			Category:      "Professional Diploma",
			DurationYears: 3,
			Summary:       "Focuses on preventing disease by controlling environmental factors — ensuring air, water, food, housing, and workplaces are safe.",
			CoreDuties:    "Ensuring that air, water, food, housing, and workplaces are safe so that people don't get sick; inspecting facilities and enforcing sanitation standards.",
			PlacesOfWork:  "LGA Environmental Departments, State Ministries of Health, hospitals, and NGOs.",
			ImageURL:      "/images/program-eht.jpg",
		},
	}

	for _, p := range programs {
		var existing models.Program
		if err := dbc.Where("slug = ?", p.Slug).First(&existing).Error; err != nil {
			dbc.Create(&p)
		} else {
			p.ID = existing.ID
			dbc.Model(&existing).Updates(p)
		}
	}
	log.Println("seed: programs ready")
}

func seedAdmin(dbc *gorm.DB, cfg *config.Config) {
	var existing models.Admin
	if err := dbc.Where("email = ?", cfg.AdminEmail).First(&existing).Error; err == nil {
		return
	}
	hash, err := auth.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Fatalf("seed: could not hash admin password: %v", err)
	}
	admin := models.Admin{
		Email:        cfg.AdminEmail,
		PasswordHash: hash,
		Name:         cfg.AdminName,
		Role:         "admin",
	}
	if err := dbc.Create(&admin).Error; err != nil {
		log.Fatalf("seed: could not create default admin: %v", err)
	}
	log.Printf("seed: default admin created (%s)", cfg.AdminEmail)
}
