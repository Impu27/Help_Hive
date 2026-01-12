import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
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
  registeredEvents: any[] = [];
  recentSubmissions: Submission[] = [];
  loading = true;

  stats = {
    totalPoints: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    eventsParticipated: 0,
    registeredEvents: 0
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef // ✅ Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    forkJoin({
      upcoming: this.apiService.getEvents({ status: 'upcoming' }).pipe(take(1)),
      registrations: this.apiService.getMyRegistrations().pipe(take(1)),
      submissions: this.apiService.getMySubmissions().pipe(take(1))
    }).subscribe({
      next: ({ upcoming, registrations, submissions }) => {
        // Upcoming events
        this.upcomingEvents = upcoming.success && upcoming.data ? upcoming.data.slice(0, 3) : [];

        // My registrations
        this.registeredEvents = registrations.success && registrations.data ? registrations.data : [];
        this.stats.registeredEvents = this.registeredEvents.length;

        // Submissions
        this.recentSubmissions = submissions.success && submissions.data ? submissions.data.slice(0, 5) : [];
        this.stats.totalPoints = this.currentUser?.totalPoints || 0;
        this.stats.pendingSubmissions = this.recentSubmissions.filter(s => s.status === 'pending').length;
        this.stats.approvedSubmissions = this.recentSubmissions.filter(s => s.status === 'approved').length;
        this.stats.eventsParticipated = this.recentSubmissions.length;

        // ✅ Force Angular to detect changes immediately
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.loading = false;
        this.cdr.detectChanges(); // ensure loading spinner disappears
      }
    });
  }

  get progressPercentage(): number {
    return Math.min((this.stats.totalPoints / 100) * 100, 100);
  }
}