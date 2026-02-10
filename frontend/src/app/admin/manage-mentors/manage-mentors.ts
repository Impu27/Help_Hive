/**
 * Manage Mentors Component
 * CO1: Admin interface to assign students to mentors
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';

interface Mentor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  mentor?: string;
  totalPoints: number;
  isActive: boolean;
}

@Component({
  selector: 'app-manage-mentors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-mentors.html',
  styleUrls: ['./manage-mentors.scss']
})
export class ManageMentorsComponent implements OnInit {
  mentors: Mentor[] = [];
  students: Student[] = [];
  selectedMentor: Mentor | null = null;
  selectedStudents: Set<string> = new Set();
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  assignedStudents: Student[] = [];
  showAssignModal = false;
  displayMode: 'mentors' | 'students' | 'assignments' = 'mentors';

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;
    console.log('📡 Loading mentors and students...');

    forkJoin({
      mentors: this.apiService.get<any>('/admin/mentors'),
      students: this.apiService.get<any>('/admin/students')
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Data loaded:', response);
        console.log('📦 Response mentors:', response.mentors);
        console.log('📦 Response students:', response.students);
        
        // Handle mentors - the response itself IS the data structure
        if (response.mentors) {
          this.mentors = (response.mentors.data || response.mentors) || [];
          console.log(`📊 Loaded ${this.mentors.length} mentors`);
        }
        
        // Handle students - the response itself IS the data structure
        if (response.students) {
          this.students = (response.students.data || response.students) || [];
          console.log(`📊 Loaded ${this.students.length} students`);
        }
        
        this.isLoading = false;
        console.log('✅ isLoading set to false');
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('❌ Error loading data:', error);
        
        // Check for specific error message
        const errorMsg = error?.error?.message || 
                         error?.message || 
                         'Failed to load mentors and students. Please ensure you are logged in as an admin.';
        
        this.error = errorMsg;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectMentor(mentor: Mentor): void {
    this.selectedMentor = mentor;
    this.selectedStudents.clear();
    this.displayMode = 'students';
    this.cdr.markForCheck();
    this.loadAssignedStudents(mentor._id);
  }

  loadAssignedStudents(mentorId: string): void {
    this.apiService.get<any>(`/admin/mentors/${mentorId}/students`).subscribe({
      next: (response: any) => {
        this.assignedStudents = response.data || response || [];
        console.log(`✅ Loaded ${this.assignedStudents.length} assigned students`);
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('❌ Error loading assigned students:', error);
        this.assignedStudents = [];
        this.cdr.markForCheck();
      }
    });
  }

  toggleStudentSelection(student: Student): void {
    if (this.selectedStudents.has(student._id)) {
      this.selectedStudents.delete(student._id);
    } else {
      this.selectedStudents.add(student._id);
    }
    this.cdr.markForCheck();
  }

  isStudentSelected(studentId: string): boolean {
    return this.selectedStudents.has(studentId);
  }

  isStudentAssigned(studentId: string): boolean {
    return this.assignedStudents.some(s => s._id === studentId);
  }

  getAvailableStudents(): Student[] {
    // Filter students that:
    // 1. Are NOT assigned to the selected mentor AND
    // 2. Are NOT assigned to any other mentor
    return this.students.filter(s => {
      const isAssignedToCurrentMentor = this.isStudentAssigned(s._id);
      const isAssignedToAnyMentor = s.mentor && s.mentor.trim() !== '';
      
      // Only show if NOT assigned to any mentor
      return !isAssignedToAnyMentor;
    });
  }

  assignStudents(): void {
    if (!this.selectedMentor) {
      this.error = 'Please select a mentor';
      this.cdr.markForCheck();
      return;
    }

    if (this.selectedStudents.size === 0) {
      this.error = 'Please select at least one student';
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();
    console.log(`📤 Assigning ${this.selectedStudents.size} students to ${this.selectedMentor.name}`);

    const payload = {
      studentIds: Array.from(this.selectedStudents)
    };

    this.apiService.post<any>(`/admin/mentors/${this.selectedMentor._id}/assign-students`, payload).subscribe({
      next: (response: any) => {
        console.log('✅ Assignment successful:', response);
        this.successMessage = `✅ ${response.data.assignedCount} students assigned to ${this.selectedMentor?.name}`;
        this.selectedStudents.clear();
        this.isLoading = false;
        this.cdr.markForCheck();
        this.loadData();
        this.loadAssignedStudents(this.selectedMentor!._id);
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.markForCheck();
        }, 5000);
      },
      error: (error: any) => {
        console.error('❌ Assignment error:', error);
        this.error = error.error?.message || 'Failed to assign students';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  removeStudent(mentorId: string, studentId: string, studentName: string): void {
    if (!confirm(`Remove ${studentName} from mentor?`)) {
      return;
    }

    console.log(`🗑️ Removing ${studentName} from mentor...`);

    this.apiService.delete<any>(`/admin/mentors/${mentorId}/students/${studentId}`).subscribe({
      next: (response: any) => {
        console.log('✅ Student removed:', response);
        this.successMessage = `✅ ${studentName} removed from mentor`;
        this.cdr.markForCheck();
        this.loadAssignedStudents(mentorId);
        this.loadData();
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.markForCheck();
        }, 5000);
      },
      error: (error: any) => {
        console.error('❌ Remove error:', error);
        this.error = error.error?.message || 'Failed to remove student';
        this.cdr.markForCheck();
      }
    });
  }

  clearSelection(): void {
    this.selectedMentor = null;
    this.selectedStudents.clear();
    this.displayMode = 'mentors';
    this.cdr.markForCheck();
  }
}
