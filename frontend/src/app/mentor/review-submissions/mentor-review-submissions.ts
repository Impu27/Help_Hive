/**
 * Mentor Review Submissions Component
 * CO1: Allows mentors to review and approve submissions from their mentees
 */

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

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
  proofData: string; // URL path or base64 image data
  proofType: 'url' | 'image'; // Backend schema values
  semester: number;
  reviewedBy?: string;
  reviewDate?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-mentor-review-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mentor-review-submissions.html',
  styleUrls: ['./mentor-review-submissions.scss']
})
export class MentorReviewSubmissionsComponent implements OnInit, OnDestroy {
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

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSubmissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubmissions(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.get('/mentor/submissions')
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.submissions = response.success && response.data ? response.data : [];
          this.filterSubmissions();
          this.isLoading = false;
          this.cdr.detectChanges(); // ✅ Force change detection
        },
        error: (error: any) => {
          console.error('Failed to load submissions:', error);
          this.error = 'Failed to load submissions. Please try again.';
          this.submissions = [];
          this.isLoading = false;
          this.cdr.detectChanges(); // ✅ Ensure UI updates on error
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

  navigateToDashboard(): void {
    window.location.href = '/mentor/dashboard';
  }

  /**
   * View proof file in a new tab
   * Same implementation as admin component
   */
  viewProof(submission: Submission, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!submission.proofData) {
      this.error = 'No proof file available for this submission.';
      setTimeout(() => this.error = null, 3000);
      return;
    }

    console.log('Viewing proof:', { 
      proofData: submission.proofData, 
      proofType: submission.proofType 
    });
    
    // If it's a file path (starts with /), construct full URL using serverUrl
    if (submission.proofData.startsWith('/')) {
      const fullUrl = `${environment.serverUrl}${submission.proofData}`;
      console.log('Opening file from:', fullUrl);
      window.open(fullUrl, '_blank');
    } else {
      // If it's a URL, open directly
      console.log('Opening URL directly');
      window.open(submission.proofData, '_blank');
    }
  }

  /**
   * Get proof type badge text based on backend's proofType field
   */
  getProofTypeBadge(submission: Submission): string {
    if (submission.proofType === 'url') {
      // Check if URL ends with common file extensions
      const urlLower = submission.proofData.toLowerCase();
      if (urlLower.endsWith('.pdf')) {
        return 'PDF';
      } else if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) {
        return 'IMAGE';
      }
      return 'FILE';
    } else if (submission.proofType === 'image') {
      return 'IMAGE';
    }
    return 'FILE';
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