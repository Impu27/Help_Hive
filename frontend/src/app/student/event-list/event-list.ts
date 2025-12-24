import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event } from '../../models/interfaces';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-list.html',
  styleUrls: ['./event-list.scss']
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  loading = false;
  error = '';

  // Registration State Properties
  myRegistrations: Set<string> = new Set(); // Store registered event IDs
  registering: Set<string> = new Set();    // Track loading state per event

  // Filters
  selectedStatus = 'all';
  selectedActivity = 'all';
  searchQuery = '';

  activityTypes = [
    'Community Service',
    'Environmental',
    'Education',
    'Healthcare',
    'Other'
  ];

  // Modal state
  selectedEvent: Event | null = null;
  showModal = false;
  showSubmitModal = false;
  submissionForm = {
    proofType: 'url',
    proofData: ''
  };
  submitting = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadEvents();
    this.loadMyRegistrations(); // Called on initialization
  }

  // --- Data Loading Methods ---

  loadEvents(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getEvents().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.events = response.data;
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load events. Please try again.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadMyRegistrations(): void {
    this.apiService.getMyRegistrations().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Convert array of registrations into a Set of IDs for O(1) lookup
          this.myRegistrations = new Set(
            response.data.map((r: any) => r.event._id)
          );
        }
      },
      error: (error) => console.error('Error loading registrations:', error)
    });
  }

  // --- Logic Helpers ---

  applyFilters(): void {
    this.filteredEvents = this.events.filter(event => {
      const statusMatch = this.selectedStatus === 'all' || event.status === this.selectedStatus;
      const activityMatch = this.selectedActivity === 'all' || event.activityType === this.selectedActivity;
      const searchMatch = !this.searchQuery || 
        event.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        event.ngo.name.toLowerCase().includes(this.searchQuery.toLowerCase());

      return statusMatch && activityMatch && searchMatch;
    });
  }

  isRegistered(eventId: string): boolean {
    return this.myRegistrations.has(eventId);
  }

  isEventFull(event: Event): boolean {
    return event.currentParticipants >= event.maxParticipants;
  }

  // --- Action Methods ---

  registerForEvent(eventId: string): void {
    if (this.registering.has(eventId)) return;
    
    this.registering.add(eventId);

    this.apiService.registerForEvent(eventId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Successfully registered for event!');
          this.myRegistrations.add(eventId);
          this.loadEvents(); // Refresh to update participant count
        }
        this.registering.delete(eventId);
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to register for event');
        this.registering.delete(eventId);
      }
    });
  }

  cancelRegistration(eventId: string): void {
    if (!confirm('Are you sure you want to cancel your registration?')) return;

    this.apiService.cancelRegistration(eventId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Registration cancelled successfully');
          this.myRegistrations.delete(eventId);
          this.loadEvents(); // Refresh to update participant count
        }
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to cancel registration');
      }
    });
  }

  // --- Modal Methods ---

  viewDetails(event: Event): void {
    this.selectedEvent = event;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedEvent = null;
  }

  openSubmitModal(event: Event): void {
    this.selectedEvent = event;
    this.showSubmitModal = true;
    this.submissionForm = { proofType: 'url', proofData: '' };
  }

  closeSubmitModal(): void {
    this.showSubmitModal = false;
    this.selectedEvent = null;
    this.submissionForm = { proofType: 'url', proofData: '' };
  }

  submitProof(): void {
    if (!this.selectedEvent || !this.submissionForm.proofData) {
      return;
    }

    this.submitting = true;

    const submissionData = {
      eventId: this.selectedEvent._id,
      proofType: this.submissionForm.proofType,
      proofData: this.submissionForm.proofData
    };

    this.apiService.submitProof(submissionData).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Proof submitted successfully! Please wait for admin approval.');
          this.closeSubmitModal();
        }
        this.submitting = false;
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to submit proof');
        this.submitting = false;
      }
    });
  }
}