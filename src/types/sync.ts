export interface UserIdentity {
  uuid: string;
  name: string;
  department: string;
  university: string;
}

export interface AcademicData {
  semesters?: unknown;
  currentCGPA?: number;
  totalCredits?: number;
}

export interface FeedbackSubmission {
  fullName: string;
  university: string;
  subject: string;
  context: string;
}
