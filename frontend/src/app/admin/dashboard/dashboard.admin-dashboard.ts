// // ===== src/app/admin/dashboard/admin-dashboard.component.ts =====
// /**
//  * Admin Dashboard Component
//  * CO1: Admin overview UI
//  * CO4: Display admin statistics
//  */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
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

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef // ✅ Needed for immediate template update
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  // --- Data Loading ---
  loadStats(): void {
    this.loading = true;

    this.apiService.getDashboardStats()
      .pipe(take(1)) // ✅ memory safety
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.stats = response.data;
          }
          this.loading = false;

          // ✅ Force Angular to update the template immediately
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading admin stats:', error);
          this.loading = false;
          this.cdr.detectChanges(); // ✅ ensure loading spinner disappears
        }
      });
  }

  // --- Statistics Logic ---
  getApprovalRate(): number {
    const total = this.stats.approvedSubmissions + this.stats.pendingSubmissions;
    return total === 0 ? 0 : Math.round((this.stats.approvedSubmissions / total) * 100);
  }

  getAvgPointsPerStudent(): number {
    return this.stats.totalStudents === 0
      ? 0
      : Math.round(this.stats.totalPointsAwarded / this.stats.totalStudents);
  }
}