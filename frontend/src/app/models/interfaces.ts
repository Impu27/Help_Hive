// ===== src/app/models/interfaces.ts =====
/**
 * TypeScript interfaces for type safety
 * CO1: Strong typing for Angular components
 */

/* ===================== USER ===================== */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'admin';
  studentId?: string;
  totalPoints: number;
}

/* ===================== NGO ===================== */
export interface Ngo {
  _id: string;
  name: string;
  officialWebsite?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  causes: string[];
  aicteActivities: string[];
}

/* ===================== EVENT ===================== */
export interface Event {
  _id: string;
  title: string;
  description: string;
  ngo: Ngo;
  activityType: string;
  pointsAwarded: number;
  eventDate: Date;
  eventEndDate?: Date;
  location?: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: string;
}

/* ===================== REGISTRATION ===================== */
export interface Registration {
  _id: string;
  student: User | string;
  event: Event | string;
  semester: number;
  usn: string;
  status: 'registered' | 'attended' | 'cancelled';
  registrationDate: Date;
}

/* ===================== SUBMISSION ===================== */
export interface Submission {
  _id: string;
  student: User;
  event: Event;
  semester: number;
  proofType: 'url' | 'image' | 'file'; //  FIXED
  proofData: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: User;
  reviewDate?: Date;
  reviewNotes?: string;
  createdAt: Date;
}

/* ===================== ADMIN DASHBOARD ===================== */
export interface DashboardStats {
  totalStudents: number;
  totalEvents: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  totalPointsAwarded: number;
}

/* ===================== GENERIC API RESPONSE ===================== */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;        //  optional (important)
  message?: string;
  count?: number;
}
