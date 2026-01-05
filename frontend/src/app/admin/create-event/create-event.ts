// ===== src/app/admin/create-event/create-event.component.ts =====
/**
 * Create Event Component
 * CO1: Event creation form
 * CO3: Select NGOs from database
 * CO4: Submit event to API
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { Ngo } from '../../models/interfaces';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-event.html',
  styleUrls: ['./create-event.scss']
})
export class CreateEventComponent implements OnInit, OnDestroy {
  eventForm: FormGroup;
  ngos: Ngo[] = [];
  loading = false;
  submitting = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  activityTypes = [
    'Community Service',
    'Environmental',
    'Education',
    'Healthcare',
    'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      ngo: ['', Validators.required],
      activityType: ['', Validators.required],
      pointsAwarded: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      eventDate: ['', Validators.required],
      eventEndDate: [''],
      location: [''],
      maxParticipants: [50, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    // 🔥 Reload NGOs when route is re-entered
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadNgos();
      });

    // Initial load
    this.loadNgos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Loading ---
  loadNgos(): void {
    this.loading = true;

    this.apiService.getNgos()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.ngos = response.success && response.data
            ? response.data
            : [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading NGOs:', error);
          this.loading = false;
        }
      });
  }

  // --- Form Submission ---
  onSubmit(): void {
    if (this.eventForm.invalid) {
      Object.values(this.eventForm.controls).forEach(control =>
        control.markAsTouched()
      );
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.apiService.createEvent(this.eventForm.value)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success) {
            alert('Event created successfully!');
            this.router.navigate(['/admin/dashboard']);
          }
          this.submitting = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to create event';
          this.submitting = false;
        }
      });
  }

  // --- Helpers ---
  getSelectedNgo(): Ngo | undefined {
    const ngoId = this.eventForm.get('ngo')?.value;
    return this.ngos.find(n => n._id === ngoId);
  }
}
