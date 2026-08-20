import { z } from "zod";

export const applySchema = z
  .object({
    programId: z.number({ error: "Please select a programme" }).min(1, "Please select a programme"),

    firstName: z.string().min(2, "Enter your first name"),
    lastName: z.string().min(2, "Enter your last name"),
    email: z.email("Enter a valid email address"),
    phone: z.string().min(7, "Enter a valid phone number"),
    dateOfBirth: z.string().min(1, "Select your date of birth"),
    gender: z.string().min(1, "Select your gender"),
    address: z.string().min(5, "Enter your residential address"),
    stateOfOrigin: z.string().min(2, "Enter your state of origin"),
    guardianName: z.string().min(2, "Enter a parent/guardian name"),
    guardianPhone: z.string().min(7, "Enter a parent/guardian phone number"),

    schoolAttended: z.string().min(2, "Enter your last school attended"),
    qualificationType: z.string().min(1, "Select your qualification"),
    examType: z.string().min(1, "Select your exam type"),
    examNumber: z.string().min(4, "Enter your examination number"),
    subjects: z.string().optional(),

    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ApplyFormValues = z.infer<typeof applySchema>;

export const STEP_FIELDS: Record<number, (keyof ApplyFormValues)[]> = {
  0: ["programId"],
  1: ["firstName", "lastName", "email", "phone", "dateOfBirth", "gender", "address", "stateOfOrigin", "guardianName", "guardianPhone"],
  2: ["schoolAttended", "qualificationType", "examType", "examNumber"],
  3: ["password", "confirmPassword"],
};
