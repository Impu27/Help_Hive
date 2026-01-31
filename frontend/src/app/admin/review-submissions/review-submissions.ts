// // ===== src/app/admin/review-submissions/review-submissions.component.ts =====
// /**
//  * Review Submissions Component
//  * CO1: Clear Approve/Reject UI
//  * CO3: Automated point calculation on approval
//  * CO4: Update submissions via API
//  */

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { Submission } from '../../models/interfaces';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-review-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './review-submissions.html',
  styleUrls: ['./review-submissions.scss']
})
export class ReviewSubmissionsComponent implements OnInit, OnDestroy {
  submissions: Submission[] = [];
  loading = false;

  // Review modal
  selectedSubmission: Submission | null = null;
  showReviewModal = false;
  reviewNotes = '';
  reviewing = false;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef // ✅ Force Angular change detection
  ) {}

  ngOnInit(): void {
    // Reload data whenever this route is navigated to
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadPendingSubmissions();
      });

    // Initial load
    this.loadPendingSubmissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Loading ---
  loadPendingSubmissions(): void {
    this.loading = true;

    this.apiService.getPendingSubmissions()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.submissions = response.success && response.data ? response.data : [];
          this.loading = false;
          this.cdr.detectChanges(); // ✅ Update template immediately
        },
        error: (error) => {
          console.error('Error loading submissions:', error);
          this.loading = false;
          this.cdr.detectChanges(); // ✅ Ensure spinner disappears on error
        }
      });
  }

  // --- Modal Management ---
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

  // --- Review Actions ---
  reviewSubmission(status: 'approved' | 'rejected'): void {
    if (!this.selectedSubmission) return;

    this.reviewing = true;

    const reviewData = {
      status,
      reviewNotes: this.reviewNotes
    };

    this.apiService.reviewSubmission(this.selectedSubmission._id, reviewData)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Submission ${status}!`);
            this.closeReviewModal();
            this.loadPendingSubmissions(); // ✅ Refresh data immediately
          }
          this.reviewing = false;
          this.cdr.detectChanges(); // ✅ Update modal & buttons
        },
        error: (error) => {
          alert(error.error?.message || 'Failed to review submission');
          this.reviewing = false;
          this.cdr.detectChanges(); // ✅ Ensure button state updates
        }
      });
  }

  // --- Helpers ---
  viewProof(proofData: string, proofType: string): void {
    console.log('Viewing proof:', { proofData, proofType });
    
    // If it's a file path (starts with /), construct full URL using serverUrl
    if (proofData.startsWith('/')) {
      const fullUrl = `${environment.serverUrl}${proofData}`;
      console.log('Opening file from:', fullUrl);
      window.open(fullUrl, '_blank');
    } else {
      // If it's a URL, open directly
      console.log('Opening URL directly');
      window.open(proofData, '_blank');
    }
  }
}