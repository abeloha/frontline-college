// Package models holds every GORM entity for the admissions platform.
package models

import "time"

// Program is a course of study offered by the college (seeded content,
// managed by editing the seed data — no admin CRUD UI per current scope).
type Program struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	Slug          string `gorm:"uniqueIndex;size:120" json:"slug"`
	Name          string `gorm:"size:200" json:"name"`
	Category      string `gorm:"size:60" json:"category"` // "Professional Diploma" | "National Diploma"
	DurationYears int    `json:"durationYears"`
	Summary       string `gorm:"type:text" json:"summary"`
	CoreDuties    string `gorm:"type:text" json:"coreDuties"`
	PlacesOfWork  string `gorm:"type:text" json:"placesOfWork"`
	ImageURL      string `gorm:"size:255" json:"imageUrl"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// Student is an applicant's login account, created at the point they submit
// an application.
type Student struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;size:190" json:"email"`
	PasswordHash string    `gorm:"size:255" json:"-"`
	FirstName    string    `gorm:"size:100" json:"firstName"`
	LastName     string    `gorm:"size:100" json:"lastName"`
	Phone        string    `gorm:"size:40" json:"phone"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`

	Applications []Application `json:"applications,omitempty"`
}

// Application status lifecycle (linear, each value only moves forward except
// Rejected which is terminal and ApplicationFeeReview/SchoolFeeReview which
// can bounce back to *Pending on a rejected proof):
const (
	StatusSubmitted            = "submitted"             // just created, no fee proof yet
	StatusApplicationFeeReview = "application_fee_review" // proof uploaded, awaiting admin
	StatusUnderReview          = "under_review"           // fee verified, admin deciding
	StatusAccepted             = "accepted"               // admin accepted (letter may follow)
	StatusRejected             = "rejected"               // terminal
	StatusAdmissionAccepted    = "admission_accepted"      // student accepted offer
	StatusSchoolFeeReview      = "school_fee_review"       // school fee proof uploaded
	StatusEnrolled             = "enrolled"                // school fee verified, done
)

// Application is one applicant's admission attempt for a single program.
type Application struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	ApplicationNumber string    `gorm:"uniqueIndex;size:40" json:"applicationNumber"`
	StudentID         uint      `json:"studentId"`
	Student           Student   `json:"student,omitempty"`
	ProgramID         uint      `json:"programId"`
	Program           Program   `json:"program,omitempty"`
	Status            string    `gorm:"size:40;index" json:"status"`

	// Personal details
	DateOfBirth   string `gorm:"size:20" json:"dateOfBirth"`
	Gender        string `gorm:"size:20" json:"gender"`
	Address       string `gorm:"type:text" json:"address"`
	StateOfOrigin string `gorm:"size:80" json:"stateOfOrigin"`
	GuardianName  string `gorm:"size:150" json:"guardianName"`
	GuardianPhone string `gorm:"size:40" json:"guardianPhone"`

	// Academic background
	SchoolAttended     string `gorm:"size:200" json:"schoolAttended"`
	QualificationType  string `gorm:"size:100" json:"qualificationType"`
	ExamType           string `gorm:"size:40" json:"examType"`
	ExamNumber         string `gorm:"size:60" json:"examNumber"`
	Subjects           string `gorm:"type:text" json:"subjects"` // free-form "Subject: Grade" lines

	RejectionReason     string     `gorm:"type:text" json:"rejectionReason,omitempty"`
	SubmittedAt         time.Time  `json:"submittedAt"`
	ReviewedAt          *time.Time `json:"reviewedAt,omitempty"`
	ReviewedBy          *uint      `json:"reviewedBy,omitempty"`
	AdmissionAcceptedAt *time.Time `json:"admissionAcceptedAt,omitempty"`

	PaymentProofs   []PaymentProof   `json:"paymentProofs,omitempty"`
	AdmissionLetter *AdmissionLetter `json:"admissionLetter,omitempty"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

const (
	PaymentTypeApplicationFee = "application_fee"
	PaymentTypeSchoolFee      = "school_fee"

	PaymentStatusPending  = "pending"
	PaymentStatusVerified = "verified"
	PaymentStatusRejected = "rejected"
)

// PaymentProof is a receipt/screenshot a student uploads against either the
// application fee or the school fee.
type PaymentProof struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	ApplicationID uint       `gorm:"index" json:"applicationId"`
	Type          string     `gorm:"size:30" json:"type"`
	FilePath      string     `gorm:"size:255" json:"-"`
	FileURL       string     `gorm:"-" json:"fileUrl"`
	Amount        float64    `json:"amount"`
	Status        string     `gorm:"size:20" json:"status"`
	Notes         string     `gorm:"type:text" json:"notes,omitempty"`
	UploadedAt    time.Time  `json:"uploadedAt"`
	ReviewedAt    *time.Time `json:"reviewedAt,omitempty"`
	ReviewedBy    *uint      `json:"reviewedBy,omitempty"`
}

// AdmissionLetter is the PDF/image an admin uploads once an application is
// accepted.
type AdmissionLetter struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	ApplicationID uint      `gorm:"uniqueIndex" json:"applicationId"`
	FilePath      string    `gorm:"size:255" json:"-"`
	FileURL       string    `gorm:"-" json:"fileUrl"`
	UploadedAt    time.Time `json:"uploadedAt"`
	UploadedBy    uint      `json:"uploadedBy"`
}

// Admin is a staff login for the admissions portal.
type Admin struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;size:190" json:"email"`
	PasswordHash string    `gorm:"size:255" json:"-"`
	Name         string    `gorm:"size:150" json:"name"`
	Role         string    `gorm:"size:30" json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
}
