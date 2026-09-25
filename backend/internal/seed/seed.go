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
	seedSchoolFees(dbc)
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
			// Slug intentionally left unchanged from its original
			// "health-education-and-promotion" value — this is a rename of
			// the same program (matched below by slug, so it updates the
			// existing row in place), not a new program, and changing the
			// slug would break any existing bookmarked/indexed URL.
			Slug:          "health-education-and-promotion",
			Name:          "Health Information Management (HIM)",
			Category:      "National Diploma",
			DurationYears: 3,
			Summary:       "Trains health information officers to manage patient records, health data systems and reporting for hospitals and public health programs.",
			CoreDuties:    "Compiling and managing patient records, health data entry and analysis, disease coding and classification, HMIS/DHIS2 reporting, and safeguarding patient data confidentiality.",
			PlacesOfWork:  "Hospitals, Primary Healthcare Centers, State and Federal Ministries of Health, health insurance providers, and NGOs running health data systems.",
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

// standardFeeLines is the set of line items shared by every programme's
// school-fee breakdown — everything except tuition, which differs by
// programme group (see seedSchoolFees).
var standardFeeLines = []struct {
	Label  string
	Amount float64
}{
	{"Administrative Charges", 10000},
	{"Library and ICT", 10000},
	{"Uniform/Lab Coat and School Badge", 25000},
	{"I.D card", 3000},
	{"Medical Fee", 10000},
	{"Departmental Fee", 5000},
	{"Developmental Fee", 5000},
	{"Exams", 20000},
	{"T-Shirt", 10000},
	{"Matric", 10000},
}

// feeGroups maps each programme slug to its tuition fee. Every other line
// item is identical across programmes (standardFeeLines above) — only
// tuition varies, which is what actually produces the two distinct totals
// the college quoted (₦178,000 and ₦188,000).
var feeGroups = map[string]float64{
	"public-health-technicians":          70000, // ₦178,000 total
	"environmental-health-technology":    70000, // ₦178,000 total
	"health-education-and-promotion":     70000, // ₦178,000 total (now "Health Information Management")
	"community-health-extension-workers": 80000, // ₦188,000 total
	"retraining-chew":                    80000, // ₦188,000 total
	"junior-chew":                        80000, // ₦188,000 total
}

// seedSchoolFees gives every programme a starting itemized school-fee
// breakdown. Deliberately non-destructive: a programme that already has at
// least one SchoolFeeItem is left completely alone, so an admin's edits via
// UpdateFeeStructure are never clobbered by a server restart re-running this
// seed. Only a programme with zero fee items (a first run, or a brand new
// programme added later) gets seeded.
func seedSchoolFees(dbc *gorm.DB) {
	for slug, tuition := range feeGroups {
		var program models.Program
		if err := dbc.Where("slug = ?", slug).First(&program).Error; err != nil {
			log.Printf("seed: school fees skipped for %q — programme not found", slug)
			continue
		}

		var count int64
		dbc.Model(&models.SchoolFeeItem{}).Where("program_id = ?", program.ID).Count(&count)
		if count > 0 {
			continue // admin-owned from here on
		}

		items := []models.SchoolFeeItem{{ProgramID: program.ID, Label: "Tuition fee", Amount: tuition, SortOrder: 0}}
		for i, line := range standardFeeLines {
			items = append(items, models.SchoolFeeItem{
				ProgramID: program.ID,
				Label:     line.Label,
				Amount:    line.Amount,
				SortOrder: i + 1,
			})
		}
		if err := dbc.Create(&items).Error; err != nil {
			log.Printf("seed: could not seed school fees for %q: %v", slug, err)
		}
	}
	log.Println("seed: school fee breakdowns ready")
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
