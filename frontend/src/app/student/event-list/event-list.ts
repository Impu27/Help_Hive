import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  submitting = false;

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
  showRegistrationModal = false;

  // ================= REGISTRATION FORM =================
  registrationForm = {
    semester: '',
    usn: ''
  };
  registrationError = '';

  // ================= FILE UPLOAD =================
  selectedFile: File | null = null;
  submissionForm = {
    proofType: 'url',
    proofData: ''
  };

  constructor(
    private apiService: ApiService,
    public cdr: ChangeDetectorRef // ✅ make public for template access
  ) {}

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
          this.events = response.success && response.data ? response.data : [];
          this.applyFilters();
          this.loading = false;
          this.cdr.detectChanges(); // ✅ immediately update template
        },
        error: () => {
          this.error = 'Failed to load events.';
          this.loading = false;
          this.cdr.detectChanges(); // ✅ ensure spinner disappears
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
            this.cdr.detectChanges(); // ✅ update registration badges
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
            this.cdr.detectChanges(); // ✅ update submission badges
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
        this.selectedActivity === 'all' || event.activityType === this.selectedActivity;

      const searchMatch =
        !this.searchQuery ||
        event.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        event.ngo.name.toLowerCase().includes(this.searchQuery.toLowerCase());

      // Smart filtering: Hide completed events unless:
      // 1. User is explicitly viewing "Completed" events, OR
      // 2. User has registered for this event (history/reference)
      let completionMatch = true;
      if (this.selectedStatus !== 'completed' && event.status === 'completed') {
        // Only show completed event if user is registered for it
        completionMatch = this.isRegistered(event._id);
      }

      return statusMatch && activityMatch && searchMatch && completionMatch;
    });
    this.cdr.detectChanges(); // ✅ ensure filtered list renders immediately
  }

  isRegistered(eventId: string): boolean {
    return this.myRegistrations.has(eventId);
  }

  hasUnregisteredCompletedEvents(): boolean {
    return this.events.some(e => 
      e.status === 'completed' && !this.isRegistered(e._id)
    );
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
  // ACTIONS
  // =====================================================
  registerForEvent(eventId: string): void {
    this.selectedEvent = this.events.find(e => e._id === eventId) || null;
    this.showRegistrationModal = true;
    this.registrationForm = { semester: '', usn: '' };
    this.registrationError = '';
    this.cdr.detectChanges();
  }

  closeRegistrationModal(): void {
    this.showRegistrationModal = false;
    this.selectedEvent = null;
    this.registrationForm = { semester: '', usn: '' };
    this.registrationError = '';
    this.cdr.detectChanges();
  }

  submitRegistration(): void {
    if (!this.selectedEvent || !this.validateRegistrationForm()) {
      return;
    }

    if (this.registering.has(this.selectedEvent._id)) return;

    this.registering.add(this.selectedEvent._id);
    this.registrationError = '';

    this.apiService.registerForEvent(
      this.selectedEvent._id,
      parseInt(this.registrationForm.semester),
      this.registrationForm.usn.toUpperCase()
    )
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.myRegistrations.add(this.selectedEvent!._id);

            const event = this.events.find(e => e._id === this.selectedEvent!._id);
            if (event) event.currentParticipants += 1;

            this.applyFilters();
            this.closeRegistrationModal();
          }
          this.registering.delete(this.selectedEvent!._id);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.registrationError = err.error?.message || 'Registration failed';
          this.registering.delete(this.selectedEvent!._id);
          this.cdr.detectChanges();
        }
      });
  }

  validateRegistrationForm(): boolean {
    if (!this.registrationForm.semester || !this.registrationForm.usn) {
      this.registrationError = 'Semester and USN are required';
      return false;
    }

    const semester = parseInt(this.registrationForm.semester);
    if (isNaN(semester) || semester < 1 || semester > 8) {
      this.registrationError = 'Semester must be between 1 and 8';
      return false;
    }

    if (!/^[A-Z0-9]+$/.test(this.registrationForm.usn.toUpperCase())) {
      this.registrationError = 'USN must contain only letters and numbers';
      return false;
    }

    return true;
  }

  cancelRegistration(eventId: string): void {
    if (!confirm('Cancel registration?')) return;

    this.apiService.cancelRegistration(eventId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.myRegistrations.delete(eventId);

          const event = this.events.find(e => e._id === eventId);
          if (event && event.currentParticipants > 0) event.currentParticipants -= 1;

          this.applyFilters();
          this.cdr.detectChanges(); // ✅ update template immediately
        }
      });
  }

  // =====================================================
  // MODALS
  // =====================================================
  viewDetails(event: Event): void {
    this.selectedEvent = event;
    this.showModal = true;
    this.cdr.detectChanges(); // ✅ render modal immediately
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedEvent = null;
    this.cdr.detectChanges(); // ✅ update template
  }

  openSubmitModal(event: Event): void {
    this.selectedEvent = event;
    this.showSubmitModal = true;
    this.submissionForm = { proofType: 'url', proofData: '' };
    this.selectedFile = null;
    this.cdr.detectChanges(); // ✅ render submit modal
  }

  closeSubmitModal(): void {
    this.showSubmitModal = false;
    this.selectedEvent = null;
    this.cdr.detectChanges();
  }

  // =====================================================
  // SUBMIT PROOF
  // =====================================================
  submitProof(): void {
    if (!this.selectedEvent || !this.canSubmit()) return;

    this.submitting = true;
    this.cdr.detectChanges(); // ✅ disable buttons immediately

    const formData = new FormData();
    formData.append('eventId', this.selectedEvent._id);
    formData.append('proofType', this.submissionForm.proofType);

    if (this.submissionForm.proofType === 'file' && this.selectedFile) {
      formData.append('proofFile', this.selectedFile);
    } else {
      formData.append('proofData', this.submissionForm.proofData);
    }

    console.log('Submitting proof with FormData:', {
      eventId: this.selectedEvent._id,
      proofType: this.submissionForm.proofType,
      hasFile: !!this.selectedFile,
      hasProofData: !!this.submissionForm.proofData
    });

    this.apiService.submitProofWithFile(formData)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          console.log('Submission response:', response);
          if (response.success) {
            alert('Proof submitted successfully!');
            this.mySubmissions.set(this.selectedEvent!._id, 'pending');
            this.closeSubmitModal();
            this.applyFilters();
          }
          this.submitting = false;
          this.cdr.detectChanges(); // ✅ update UI immediately
        },
        error: (err) => {
          console.error('Submission error:', err);
          const errorMsg = err.error?.message || err.message || 'Failed to submit proof';
          alert(`Failed to submit proof: ${errorMsg}`);
          this.submitting = false;
          this.cdr.detectChanges(); // ✅ update UI immediately
        }
      });
  }
}