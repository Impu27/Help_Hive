// ===== src/app/models/interfaces.ts =====
/**
 * TypeScript interfaces for type safety
 * CO1: Strong typing for Angular components
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  studentId?: string;
  totalPoints: number;
}

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

export interface Submission {
  _id: string;
  student: User;
  event: Event;
  proofType: 'url' | 'image';
  proofData: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: User;
  reviewDate?: Date;
  reviewNotes?: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}
