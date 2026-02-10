/**
 * Mentor Events Component
 * CO1: Displays events created by the mentor
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface Event {
  _id: string;
  title: string;
  description: string;
  eventDate: Date;
  activityType: string;
  pointsAwarded: number;
  hoursEquivalent: number;
  location?: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
}

@Component({
  selector: 'app-mentor-events',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mentor-events.html',
  styleUrls: ['./mentor-events.scss']
})
export class MentorEventsComponent implements OnInit {
  events: Event[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.get('/mentor/events').subscribe({
      next: (response: any) => {
        if (response.success) {
          this.events = response.data;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Failed to load events:', error);
        this.error = 'Failed to load events. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'status-upcoming';
      case 'ongoing':
        return 'status-ongoing';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getCapacityPercentage(current: number, max: number): number {
    return Math.round((current / max) * 100);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
