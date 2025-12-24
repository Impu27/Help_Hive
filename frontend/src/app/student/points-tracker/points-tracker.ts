// ===== src/app/student/points-tracker/points-tracker.component.ts =====
/**
 * Points Tracker Component
 * CO1: Impact Journey progress visualization
 * CO4: Display submission history
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  loadSubmissions(): void {
    this.loading = true;

    this.apiService.getMySubmissions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.submissions = response.data;
          this.calculateStats();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading submissions:', error);
        this.loading = false;
      }
    });
  }

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
  }

  get progressPercentage(): number {
    // Target: 100 AICTE points
    return Math.min((this.totalPoints / 100) * 100, 100);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
