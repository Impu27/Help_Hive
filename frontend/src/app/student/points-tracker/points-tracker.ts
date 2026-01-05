// ===== src/app/student/points-tracker/points-tracker.component.ts =====
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs/operators'; // ✅ Added import
import { Submission } from '../../models/interfaces';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-points-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './points-tracker.html',
  styleUrls: ['./points-tracker.scss']
})
export class PointsTrackerComponent implements OnInit {
  submissions: Submission[] = [];
  loading = false;
  error = ''; 
  totalPoints = 0;

  stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    totalEarned: 0
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.totalPoints = this.authService.currentUserValue?.totalPoints || 0;
    this.loadSubmissions();
  }

  // --- Data Loading ---
  loadSubmissions(): void {
    this.loading = true;
    this.error = ''; 

    console.log('Loading submissions...'); 

    this.apiService.getMySubmissions()
      .pipe(take(1)) // ✅ Added pipe for memory safety
      .subscribe({
        next: (response) => {
          console.log('Submissions response:', response); 
          
          if (response.success && response.data) {
            this.submissions = response.data;
            this.calculateStats();
          } else {
            console.warn('No submissions data in response');
            this.submissions = [];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading submissions:', error); 
          this.error = 'Failed to load submissions. Please try again.';
          this.loading = false;
        }
      });
  }

  // --- Statistics Logic ---
  calculateStats(): void {
    this.stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      totalEarned: 0
    };

    this.submissions.forEach(submission => {
      if (submission.status === 'pending') this.stats.pending++;
      if (submission.status === 'approved') {
        this.stats.approved++;
        this.stats.totalEarned += submission.event.pointsAwarded;
      }
      if (submission.status === 'rejected') this.stats.rejected++;
    });

    console.log('Calculated stats:', this.stats);
  }

  // --- Helpers ---
  get progressPercentage(): number {
    return Math.min((this.totalPoints / 100) * 100, 100);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}