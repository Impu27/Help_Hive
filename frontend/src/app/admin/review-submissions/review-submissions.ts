// ===== src/app/admin/review-submissions/review-submissions.component.ts =====
/**
 * Review Submissions Component
 * CO1: Clear Approve/Reject UI
 * CO3: Automated point calculation on approval
 * CO4: Update submissions via API
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Submission } from '../../models/interfaces';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-review-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-submissions.html',
  styleUrls: ['./review-submissions.scss']
})
export class ReviewSubmissionsComponent implements OnInit {
  submissions: Submission[] = [];
  loading = false;
  
  // Review modal
  selectedSubmission: Submission | null = null;
  showReviewModal = false;
  reviewNotes = '';
  reviewing = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPendingSubmissions();
  }

  loadPendingSubmissions(): void {
    this.loading = true;

    this.apiService.getPendingSubmissions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.submissions = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading submissions:', error);
        this.loading = false;
      }
    });
  }

  openReviewModal(submission: Submission): void {
    this.selectedSubmission = submission;
    this.showReviewModal = true;
    this.reviewNotes = '';
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedSubmission = null;
    this.reviewNotes = '';
  }

  reviewSubmission(status: 'approved' | 'rejected'): void {
    if (!this.selectedSubmission) return;

    this.reviewing = true;

    const reviewData = {
      status,
      reviewNotes: this.reviewNotes
    };

    this.apiService.reviewSubmission(this.selectedSubmission._id, reviewData).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`Submission ${status}!`);
          this.loadPendingSubmissions(); // Reload list
          this.closeReviewModal();
        }
        this.reviewing = false;
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to review submission');
        this.reviewing = false;
      }
    });
  }

  viewProof(proofData: string, proofType: string): void {
    if (proofType === 'url') {
      window.open(proofData, '_blank');
    } else {
      // For image links, open in new tab
      window.open(proofData, '_blank');
    }
  }
}
