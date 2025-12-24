// ===== src/app/admin/dashboard/admin-dashboard.component.ts =====
/**
 * Admin Dashboard Component
 * CO1: Admin overview UI
 * CO4: Display admin statistics
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.admin-dashboard.html',
  styleUrls: ['./dashboard.admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnInit {

  loading = true;

  stats = {
    totalStudents: 0,
    totalEvents: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    totalPointsAwarded: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;

    this.apiService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.loading = false;
      }
    });
  }

  getApprovalRate(): number {
    const total =
      this.stats.approvedSubmissions + this.stats.pendingSubmissions;

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (this.stats.approvedSubmissions / total) * 100
    );
  }

  getAvgPointsPerStudent(): number {
    if (this.stats.totalStudents === 0) {
      return 0;
    }

    return Math.round(
      this.stats.totalPointsAwarded / this.stats.totalStudents
    );
  }
}
