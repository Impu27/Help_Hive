/**
 * Mentor Create Event Component
 * CO1: Allows mentors to create events for their assigned students
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Ngo {
  _id: string;
  name: string;
  causes: string[];
}

@Component({
  selector: 'app-mentor-create-event',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mentor-create-event.html',
  styleUrls: ['./mentor-create-event.scss']
})
export class MentorCreateEventComponent implements OnInit {
  ngos: Ngo[] = [];
  isLoading = false;
  isLoadingNgos = false;
  error: string | null = null;
  successMessage = '';

  formData = {
    title: '',
    description: '',
    ngoId: '',
    activityType: '',
    pointsAwarded: 10,
    eventDate: '',
    eventEndDate: '',
    location: '',
    maxParticipants: 50
  };

  activityTypes = [
    'Community Service',
    'Environmental',
    'Education',
    'Healthcare',
    'Other'
  ];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNgos();
  }

  loadNgos(): void {
    this.isLoadingNgos = true;
    this.error = null;
    console.log('🔄 Loading NGOs from /admin/ngos...');
    
    this.apiService.get('/admin/ngos').subscribe({
      next: (response: any) => {
        console.log('✅ NGO API Response:', response);
        console.log('📊 Response success:', response.success);
        console.log('📊 Response data:', response.data);
        console.log('📊 Response count:', response.count);
        
        if (response.success && response.data) {
          this.ngos = response.data;
          console.log(`✅ Loaded ${this.ngos.length} NGOs`);
          if (this.ngos.length > 0) {
            console.log('📋 First NGO:', this.ngos[0]);
          }
        } else if (response.data) {
          // In case response doesn't have success but has data
          this.ngos = response.data;
          console.log(`✅ Loaded ${this.ngos.length} NGOs (no success flag)`);
        } else {
          console.warn('⚠️ No data in response');
          this.error = 'No NGOs available';
        }
        
        this.isLoadingNgos = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('❌ Failed to load NGOs:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error response:', error.error);
        
        const errorMsg = error?.error?.message || error?.message || 'Failed to load NGOs. Please try again.';
        this.error = errorMsg;
        this.isLoadingNgos = false;
        this.cdr.markForCheck();
      }
    });
  }

  createEvent(): void {
    // Validation
    if (!this.formData.title || !this.formData.description || !this.formData.ngoId || 
        !this.formData.activityType || !this.formData.eventDate) {
      this.error = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.apiService.post('/mentor/events', {
      title: this.formData.title,
      description: this.formData.description,
      ngoId: this.formData.ngoId,
      activityType: this.formData.activityType,
      pointsAwarded: this.formData.pointsAwarded,
      eventDate: this.formData.eventDate,
      eventEndDate: this.formData.eventEndDate,
      location: this.formData.location,
      maxParticipants: this.formData.maxParticipants
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = 'Event created successfully! Your mentees can now register for this event.';
          this.resetForm();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Event creation failed:', error);
        this.error = 'Failed to create event. Please try again.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetForm(): void {
    this.formData = {
      title: '',
      description: '',
      ngoId: '',
      activityType: '',
      pointsAwarded: 10,
      eventDate: '',
      eventEndDate: '',
      location: '',
      maxParticipants: 50
    };
  }
}
