import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { Event } from '../../models/interfaces';
import { ApiService } from '../../services/api.service';

type SubmissionStatus = 'pending' | 'approved' | 'rejected';

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

  // ================= STATE =================
  myRegistrations = new Set<string>();
  mySubmissions = new Map<string, SubmissionStatus>();
  registering = new Set<string>();

  // ================= FILTERS =================
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

  // ================= MODALS =================
  selectedEvent: Event | null = null;
  showModal = false;
  showSubmitModal = false;
  submitting = false;

  // ================= FILE UPLOAD =================
  selectedFile: File | null = null;
  submissionForm = {
    proofType: 'url',
    proofData: ''
  };

  constructor(private apiService: ApiService) {}

  // =====================================================
  // LIFECYCLE
  // =====================================================
  ngOnInit(): void {
    this.loadEvents();
    this.loadMyRegistrations();
    this.loadMySubmissions();
  }

  // =====================================================
  // DATA LOADERS
  // =====================================================
  loadEvents(): void {
    this.loading = true;
    this.apiService.getEvents()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.events = response.data;
            this.applyFilters();
          }
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load events.';
          this.loading = false;
        }
      });
  }

  loadMyRegistrations(): void {
    this.apiService.getMyRegistrations()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.myRegistrations = new Set(
              response.data.map((r: any) => r.event._id)
            );
          }
        }
      });
  }

  loadMySubmissions(): void {
    this.apiService.getMySubmissions()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.mySubmissions.clear();
          if (response.success && response.data) {
            response.data.forEach((sub: any) => {
              const eventId = sub.event?._id || sub.event;
              this.mySubmissions.set(eventId, sub.status);
            });
          }
        },
        error: (err) => console.error('Error loading submissions', err)
      });
  }

  // =====================================================
  // HELPERS
  // =====================================================
  applyFilters(): void {
    this.filteredEvents = this.events.filter(event => {
      const statusMatch =
        this.selectedStatus === 'all' || event.status === this.selectedStatus;

      const activityMatch =
        this.selectedActivity === 'all' ||
        event.activityType === this.selectedActivity;

      const searchMatch =
        !this.searchQuery ||
        event.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
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

  getSubmissionStatus(eventId: string): SubmissionStatus | null {
    return this.mySubmissions.get(eventId) || null;
  }

  hasSubmitted(eventId: string): boolean {
    return this.mySubmissions.has(eventId);
  }

  // =====================================================
  // FILE HANDLING
  // =====================================================
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  canSubmit(): boolean {
    return this.submissionForm.proofType === 'url'
      ? !!this.submissionForm.proofData
      : !!this.selectedFile;
  }

  // =====================================================
  // ACTIONS (🔥 FIXED)
  // =====================================================
  registerForEvent(eventId: string): void {
    if (this.registering.has(eventId)) return;

    this.registering.add(eventId);

    this.apiService.registerForEvent(eventId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.success) {
            // ✅ optimistic UI update
            this.myRegistrations.add(eventId);

            const event = this.events.find(e => e._id === eventId);
            if (event) {
              event.currentParticipants += 1;
            }

            this.applyFilters();
          }
          this.registering.delete(eventId);
        },
        error: () => {
          this.registering.delete(eventId);
          alert('Registration failed');
        }
      });
  }

  cancelRegistration(eventId: string): void {
    if (!confirm('Cancel registration?')) return;

    this.apiService.cancelRegistration(eventId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.myRegistrations.delete(eventId);

          const event = this.events.find(e => e._id === eventId);
          if (event && event.currentParticipants > 0) {
            event.currentParticipants -= 1;
          }

          this.applyFilters();
        }
      });
  }

  // =====================================================
  // MODALS
  // =====================================================
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
    this.selectedFile = null;
  }

  closeSubmitModal(): void {
    this.showSubmitModal = false;
    this.selectedEvent = null;
  }

  // =====================================================
  // SUBMIT PROOF
  // =====================================================
  submitProof(): void {
    if (!this.selectedEvent || !this.canSubmit()) return;

    this.submitting = true;

    const formData = new FormData();
    formData.append('eventId', this.selectedEvent._id);
    formData.append('proofType', this.submissionForm.proofType);

    if (this.submissionForm.proofType === 'file' && this.selectedFile) {
      formData.append('proofFile', this.selectedFile);
    } else {
      formData.append('proofData', this.submissionForm.proofData);
    }

    this.apiService.submitProofWithFile(formData)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success) {
            alert('Proof submitted successfully!');
            this.mySubmissions.set(this.selectedEvent!._id, 'pending');
            this.closeSubmitModal();
            this.applyFilters();
          }
          this.submitting = false;
        },
        error: () => {
          alert('Failed to submit proof');
          this.submitting = false;
        }
      });
  }
}
