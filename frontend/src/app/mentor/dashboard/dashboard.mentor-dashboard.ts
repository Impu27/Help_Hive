/**
 * Mentor Dashboard Component
 * CO1: Displays mentor-specific analytics and mentee data
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface MentorAnalytics {
  totalMentees: number;
  totalPointsEarned: number;
  totalHours: number;
  submissions: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  studentBreakdown: Array<{
    name: string;
    studentId: string;
    totalPoints: number;
    totalHours: number;
    submissionCount: number;
  }>;
}

@Component({
  selector: 'app-mentor-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.mentor-dashboard.html',
  styleUrls: ['./dashboard.mentor-dashboard.scss']
})
export class MentorDashboardComponent implements OnInit {
  analytics: MentorAnalytics | null = null;
  isLoading = true;
  error: string | null = null;
  loadingTimeout: any;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    console.log('🔄 Requesting analytics from /mentor/analytics');

    // Set a timeout to prevent infinite loading
    this.loadingTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.error = 'Request taking too long. Please try again or contact support.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    }, 15000); // 15 second timeout

    this.apiService.get('/mentor/analytics').subscribe({
      next: (response: any) => {
        clearTimeout(this.loadingTimeout);
        console.log('✅ Analytics API response:', response);
        console.log('📊 Response data:', response.data);
        console.log('🔍 Debug info:', response._debug);
        if (response.success) {
          this.analytics = response.data;
          console.log('✅ Analytics set:', this.analytics);
          console.log('📋 Student breakdown:', this.analytics?.studentBreakdown);
        } else {
          this.error = response.message || 'Failed to load analytics';
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        clearTimeout(this.loadingTimeout);
        console.error('❌ Failed to load analytics:', error);
        console.error('📋 Error response:', error.error);
        const errorMessage = error?.error?.message || error?.message || 'Failed to load analytics. Please try again.';
        this.error = errorMessage;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
