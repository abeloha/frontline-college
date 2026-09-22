// Package models holds every GORM entity for the admissions platform.
package models

import (
	"encoding/json"
	"time"
)

// Program is a course of study offered by the college (seeded content,
// managed by editing the seed data — no admin CRUD UI per current scope).
type Program struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Slug          string    `gorm:"uniqueIndex;size:120" json:"slug"`
	Name          string    `gorm:"size:200" json:"name"`
	Category      string    `gorm:"size:60" json:"category"` // "Professional Diploma" | "National Diploma"
	DurationYears int       `json:"durationYears"`
	Summary       string    `gorm:"type:text" json:"summary"`
	CoreDuties    string    `gorm:"type:text" json:"coreDuties"`
	PlacesOfWork  string    `gorm:"type:text" json:"placesOfWork"`
	ImageURL      string    `gorm:"size:255" json:"imageUrl"`
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
	StatusSubmitted            = "submitted"              // just created, no fee proof yet
	StatusApplicationFeeReview = "application_fee_review" // proof uploaded, awaiting admin
	StatusUnderReview          = "under_review"           // fee verified, admin deciding
	StatusAccepted             = "accepted"               // admin accepted (letter may follow)
	StatusRejected             = "rejected"               // terminal
	StatusAdmissionAccepted    = "admission_accepted"     // student accepted offer
	StatusSchoolFeeReview      = "school_fee_review"      // school fee proof uploaded
	StatusEnrolled             = "enrolled"               // school fee verified, done
)

// admittedStatuses are the statuses reached only once an application has
// been accepted — used to gate Notice.AudienceAdmitted content (e.g. a
// practical placement posting) away from applicants who haven't been
// admitted yet.
var admittedStatuses = map[string]bool{
	StatusAccepted:          true,
	StatusAdmissionAccepted: true,
	StatusSchoolFeeReview:   true,
	StatusEnrolled:          true,
}

// IsAdmittedStatus reports whether an application has progressed far enough
// to count as "admitted" for Notice audience targeting.
func IsAdmittedStatus(status string) bool {
	return admittedStatuses[status]
}

// Application is one applicant's admission attempt for a single program.
type Application struct {
	ID                uint    `gorm:"primaryKey" json:"id"`
	ApplicationNumber string  `gorm:"uniqueIndex;size:40" json:"applicationNumber"`
	StudentID         uint    `json:"studentId"`
	Student           Student `json:"student,omitempty"`
	ProgramID         uint    `json:"programId"`
	Program           Program `json:"program,omitempty"`
	Status            string  `gorm:"size:40;index" json:"status"`

	// Personal details
	DateOfBirth   string `gorm:"size:20" json:"dateOfBirth"`
	Gender        string `gorm:"size:20" json:"gender"`
	Address       string `gorm:"type:text" json:"address"`
	StateOfOrigin string `gorm:"size:80" json:"stateOfOrigin"`
	GuardianName  string `gorm:"size:150" json:"guardianName"`
	GuardianPhone string `gorm:"size:40" json:"guardianPhone"`

	// Academic background
	SchoolAttended    string `gorm:"size:200" json:"schoolAttended"`
	QualificationType string `gorm:"size:100" json:"qualificationType"`
	ExamType          string `gorm:"size:40" json:"examType"`
	ExamNumber        string `gorm:"size:60" json:"examNumber"`
	Subjects          string `gorm:"type:text" json:"subjects"` // free-form "Subject: Grade" lines

	RejectionReason     string     `gorm:"type:text" json:"rejectionReason,omitempty"`
	SubmittedAt         time.Time  `json:"submittedAt"`
	ReviewedAt          *time.Time `json:"reviewedAt,omitempty"`
	ReviewedBy          *uint      `json:"reviewedBy,omitempty"`
	AdmissionAcceptedAt *time.Time `json:"admissionAcceptedAt,omitempty"`

	PaymentProofs   []PaymentProof   `json:"paymentProofs,omitempty"`
	VirtualAccounts []VirtualAccount `json:"virtualAccounts,omitempty"`
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

// NextStatusAfterVerifiedPayment is the single source of truth for what an
// Application's status becomes once a payment for proofType is confirmed —
// whether that confirmation came from an admin verifying a manual proof
// (handlers.VerifyPayment) or from a Razz virtual-account webhook
// (handlers.RazzWebhookHandler). Keeping both call sites on this one
// function means they can never drift apart.
func NextStatusAfterVerifiedPayment(proofType string) string {
	if proofType == PaymentTypeApplicationFee {
		return StatusUnderReview
	}
	return StatusEnrolled
}

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

const (
	VAStatusPending = "pending"
	VAStatusPaid    = "paid"
)

// VirtualAccount is one disposable Razz/VFD bank account issued for a single
// application-fee or school-fee payment — the automatic counterpart to
// PaymentProof's manual upload-and-review flow. Deliberately a separate
// table rather than folded into PaymentProof: it has its own pending/paid
// lifecycle driven entirely by an inbound webhook
// (handlers.RazzWebhookHandler), not by an admin action, and keeping it
// separate means the existing manual review code path (PaymentProof,
// VerifyPayment) needed zero changes to support this.
//
// Once Razz confirms payment, RazzWebhookHandler creates a corresponding
// PaymentProof row (Status: verified, no FilePath) so it shows up in the
// existing "payment history" UI and admin review panel without any of that
// code needing to know Razz exists.
type VirtualAccount struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	ApplicationID uint       `gorm:"index" json:"applicationId"`
	Type          string     `gorm:"size:30" json:"type"` // PaymentTypeApplicationFee | PaymentTypeSchoolFee
	Reference     string     `gorm:"size:64;uniqueIndex" json:"reference"`
	AccountNumber string     `gorm:"size:20" json:"accountNumber"`
	BankName      string     `gorm:"size:255" json:"bankName"`
	Amount        float64    `json:"amount"` // Naira, same convention as PaymentProof.Amount
	Status        string     `gorm:"size:20" json:"-"`
	ExpiresAt     time.Time  `json:"expiresAt"`
	PaidAt        *time.Time `json:"paidAt,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

// EffectiveStatus reports "expired" for a still-pending row whose validity
// window has passed, without needing a cron job to flip a stored column
// just to keep the label current (same technique as the Razz service's own
// PaymentCollectionRequest.EffectiveStatus).
func (v *VirtualAccount) EffectiveStatus() string {
	if v.Status == VAStatusPending && time.Now().After(v.ExpiresAt) {
		return "expired"
	}
	return v.Status
}

// MarshalJSON serializes "status" as EffectiveStatus() rather than the raw
// stored column, everywhere a VirtualAccount is serialized — directly by a
// handler or embedded in Application.VirtualAccounts — so the frontend
// never has to independently recompute expiry against ExpiresAt.
func (v VirtualAccount) MarshalJSON() ([]byte, error) {
	type alias VirtualAccount
	return json.Marshal(struct {
		alias
		Status string `json:"status"`
	}{alias: alias(v), Status: v.EffectiveStatus()})
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

const (
	NoticeCategoryGeneral   = "general"
	NoticeCategoryPlacement = "placement"
	NoticeCategoryFinance   = "finance"
	NoticeCategoryAcademic  = "academic"
	NoticeCategoryEvent     = "event"
)

// NoticeCategories is the allow-list an admin can file a Notice under —
// shared by the create/update handlers so validation can't drift from the
// set the frontend renders tabs/filters for.
var NoticeCategories = map[string]bool{
	NoticeCategoryGeneral:   true,
	NoticeCategoryPlacement: true,
	NoticeCategoryFinance:   true,
	NoticeCategoryAcademic:  true,
	NoticeCategoryEvent:     true,
}

const (
	// NoticeAudienceAll is visible to every signed-up applicant, admitted or
	// not — the default.
	NoticeAudienceAll = "all"
	// NoticeAudienceAdmitted is visible only once an applicant's own
	// application has reached an admitted status (see IsAdmittedStatus) —
	// for content, like a placement posting, that shouldn't leak to
	// applicants who haven't been accepted yet.
	NoticeAudienceAdmitted = "admitted"
)

// NoticeAudiences is the allow-list mirroring NoticeCategories above.
var NoticeAudiences = map[string]bool{
	NoticeAudienceAll:      true,
	NoticeAudienceAdmitted: true,
}

// Notice is a noticeboard post an admin publishes for students — anything
// from a general announcement to a practical placement posting. ProgramID
// is nil for a notice every student sees, or set to target only students
// enrolled in one Program (e.g. a placement posting for one course of
// study). Audience further restricts it to admitted students only.
type Notice struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Title       string     `gorm:"size:200" json:"title"`
	Body        string     `gorm:"type:text" json:"body"`
	Category    string     `gorm:"size:30;index" json:"category"`
	Audience    string     `gorm:"size:20;index;default:all" json:"audience"`
	ProgramID   *uint      `gorm:"index" json:"programId,omitempty"`
	Program     *Program   `json:"program,omitempty"`
	FilePath    string     `gorm:"size:255" json:"-"`
	FileURL     string     `gorm:"-" json:"fileUrl,omitempty"`
	Pinned      bool       `json:"pinned"`
	Published   bool       `gorm:"default:true" json:"published"`
	PublishedAt time.Time  `json:"publishedAt"`
	ExpiresAt   *time.Time `json:"expiresAt,omitempty"`
	CreatedBy   uint       `json:"createdBy"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// IsLive reports whether a student should be able to see this notice at
// all — published and not past its (optional) expiry. Program targeting is
// checked separately by the caller, since that requires knowing which
// student is asking.
func (n *Notice) IsLive() bool {
	if !n.Published {
		return false
	}
	if n.ExpiresAt != nil && time.Now().After(*n.ExpiresAt) {
		return false
	}
	return true
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
