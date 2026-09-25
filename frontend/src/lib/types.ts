export type Program = {
  id: number;
  slug: string;
  name: string;
  category: "Professional Diploma" | "National Diploma" | string;
  durationYears: number;
  summary: string;
  coreDuties: string;
  placesOfWork: string;
  imageUrl: string;
};

export type PaymentProof = {
  id: number;
  applicationId: number;
  type: "application_fee" | "school_fee";
  fileUrl: string;
  amount: number;
  status: "pending" | "verified" | "rejected";
  notes?: string;
  uploadedAt: string;
  reviewedAt?: string;
};

export type VirtualAccount = {
  id: number;
  applicationId: number;
  type: "application_fee" | "school_fee";
  reference: string;
  accountNumber: string;
  bankName: string;
  amount: number;
  status: "pending" | "paid" | "expired";
  expiresAt: string;
  paidAt?: string;
  createdAt: string;
};

export type AdmissionLetter = {
  id: number;
  applicationId: number;
  fileUrl: string;
  uploadedAt: string;
};

export type ApplicationStatus =
  | "submitted"
  | "application_fee_review"
  | "under_review"
  | "accepted"
  | "rejected"
  | "admission_accepted"
  | "school_fee_review"
  | "enrolled";

export type Student = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type Application = {
  id: number;
  applicationNumber: string;
  studentId: number;
  student?: Student;
  programId: number;
  program?: Program;
  status: ApplicationStatus;
  dateOfBirth: string;
  gender: string;
  address: string;
  stateOfOrigin: string;
  guardianName: string;
  guardianPhone: string;
  schoolAttended: string;
  qualificationType: string;
  examType: string;
  examNumber: string;
  subjects: string;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  admissionAcceptedAt?: string;
  paymentProofs?: PaymentProof[];
  virtualAccounts?: VirtualAccount[];
  admissionLetter?: AdmissionLetter | null;
};

export type SchoolFeeItem = {
  id: number;
  programId: number;
  label: string;
  amount: number;
  sortOrder: number;
};

export type SchoolFeeBreakdown = {
  items: SchoolFeeItem[];
  total: number;
};

export type PaymentInfo = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  applicationFeeAmount: number;
  schoolFeeAmount: number;
  // Only present once the applicant's own application has reached an
  // admitted status — see backend handlers.MyApplication. Not public.
  schoolFeeBreakdown?: SchoolFeeBreakdown;
  paymentMethods: { manual: boolean; razz: boolean };
};

export type FeeStructure = {
  program: Program;
  items: SchoolFeeItem[];
  total: number;
};

export type NoticeCategory = "general" | "placement" | "finance" | "academic" | "event";
export type NoticeAudience = "all" | "admitted";

export type Notice = {
  id: number;
  title: string;
  body: string;
  category: NoticeCategory;
  audience: NoticeAudience;
  programId?: number;
  program?: Program;
  fileUrl?: string;
  pinned: boolean;
  published: boolean;
  publishedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  general: "General",
  placement: "Practical Placement",
  finance: "Finance",
  academic: "Academic",
  event: "Event",
};

export const NOTICE_AUDIENCE_LABELS: Record<NoticeAudience, string> = {
  all: "All applicants",
  admitted: "Admitted students only",
};

export const STATUS_LABELS: Record<string, string> = {
  submitted: "Application Fee Pending",
  application_fee_review: "Application Fee — Pending Review",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Not Successful",
  admission_accepted: "Admission Accepted",
  school_fee_review: "School Fee — Pending Review",
  enrolled: "Enrolled",
};
