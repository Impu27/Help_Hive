// ===== src/app/student/dashboard/dashboard.component.ts =====
/**
 * Student Dashboard Component
 * CO1: Card-based Impact Dashboard UI
 * CO4: Displays user stats from API
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User, Event, Submission } from '../../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  upcomingEvents: Event[] = [];
  registeredEvents: any[] = []; // NEW: My registered events
  recentSubmissions: Submission[] = [];
  loading = true;

  stats = {
    totalPoints: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    eventsParticipated: 0,
    registeredEvents: 0 // NEW
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Get upcoming events
    this.apiService.getEvents({ status: 'upcoming' }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.upcomingEvents = response.data.slice(0, 3);
        }
      },
      error: (error) => console.error('Error loading events:', error)
    });

    // NEW: Get my registered events
    this.apiService.getMyRegistrations().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.registeredEvents = response.data;
          this.stats.registeredEvents = response.data.length;
        }
      },
      error: (error) => console.error('Error loading registrations:', error)
    });

    // Get student submissions
    this.apiService.getMySubmissions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.recentSubmissions = response.data.slice(0, 5);
          
          this.stats.totalPoints = this.currentUser?.totalPoints || 0;
          this.stats.pendingSubmissions = response.data.filter(s => s.status === 'pending').length;
          this.stats.approvedSubmissions = response.data.filter(s => s.status === 'approved').length;
          this.stats.eventsParticipated = response.data.length;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading submissions:', error);
        this.loading = false;
      }
    });
  }

  get progressPercentage(): number {
    return Math.min((this.stats.totalPoints / 100) * 100, 100);
  }
}
