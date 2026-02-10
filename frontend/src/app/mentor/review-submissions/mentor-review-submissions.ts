/**
 * Mentor Review Submissions Component
 * CO1: Allows mentors to review and approve submissions from their mentees
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Submission {
  _id: string;
  student: {
    name: string;
    email: string;
    studentId: string;
    totalPoints: number;
  };
  event: {
    title: string;
    pointsAwarded: number;
    hoursEquivalent: number;
    activityType: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  proofData: string;
  reviewNotes?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-mentor-review-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mentor-review-submissions.html',
  styleUrls: ['./mentor-review-submissions.scss']
})
export class MentorReviewSubmissionsComponent implements OnInit {
  submissions: Submission[] = [];
  filteredSubmissions: Submission[] = [];
  isLoading = true;
  error: string | null = null;
  filterStatus = 'pending';
  
  // Modal state
  selectedSubmission: Submission | null = null;
  reviewNotes = '';
  isProcessing = false;
  successMessage = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.get('/mentor/submissions').subscribe({
      next: (response: any) => {
        if (response.success) {
          this.submissions = response.data;
          this.filterSubmissions();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Failed to load submissions:', error);
        this.error = 'Failed to load submissions. Please try again.';
        this.isLoading = false;
      }
    });
  }

  filterSubmissions(): void {
    if (this.filterStatus === 'all') {
      this.filteredSubmissions = this.submissions;
    } else {
      this.filteredSubmissions = this.submissions.filter(
        s => s.status === this.filterStatus
      );
    }
  }

  openReviewModal(submission: Submission): void {
    this.selectedSubmission = submission;
    this.reviewNotes = submission.reviewNotes || '';
  }

  closeReviewModal(): void {
    this.selectedSubmission = null;
    this.reviewNotes = '';
  }

  approveSubmission(): void {
    if (!this.selectedSubmission) return;

    this.isProcessing = true;
    this.apiService.patch(
      `/mentor/submissions/${this.selectedSubmission._id}/review`,
      {
        status: 'approved',
        reviewNotes: this.reviewNotes
      }
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = 'Submission approved successfully!';
          this.selectedSubmission!.status = 'approved';
          this.filterSubmissions();
          setTimeout(() => {
            this.closeReviewModal();
            this.successMessage = '';
          }, 1500);
        }
        this.isProcessing = false;
      },
      error: (error: any) => {
        console.error('Approval failed:', error);
        this.error = 'Failed to approve submission. Please try again.';
        this.isProcessing = false;
      }
    });
  }

  rejectSubmission(): void {
    if (!this.selectedSubmission) return;

    this.isProcessing = true;
    this.apiService.patch(
      `/mentor/submissions/${this.selectedSubmission._id}/review`,
      {
        status: 'rejected',
        reviewNotes: this.reviewNotes
      }
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = 'Submission rejected successfully!';
          this.selectedSubmission!.status = 'rejected';
          this.filterSubmissions();
          setTimeout(() => {
            this.closeReviewModal();
            this.successMessage = '';
          }, 1500);
        }
        this.isProcessing = false;
      },
      error: (error: any) => {
        console.error('Rejection failed:', error);
        this.error = 'Failed to reject submission. Please try again.';
        this.isProcessing = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  }
}
