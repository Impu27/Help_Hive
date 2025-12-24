// ===== src/app/services/api.service.ts (COMPLETE FIXED VERSION) =====

import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, Event, Submission, Ngo } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Get authorization headers with JWT token
   * FIXED: Better token retrieval with browser check
   */
  private getHeaders(): HttpHeaders {
    let token = '';
    
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token') || '';
    }
    
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }

  // ===== AUTHENTICATION =====
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`, {
      headers: this.getHeaders()
    });
  }

  // ===== EVENTS =====
  getEvents(filters?: any): Observable<ApiResponse<Event[]>> {
    return this.http.get<ApiResponse<Event[]>>(`${this.apiUrl}/events`, {
      headers: this.getHeaders(),
      params: filters || {}
    });
  }

  getEventById(id: string): Observable<ApiResponse<Event>> {
    return this.http.get<ApiResponse<Event>>(`${this.apiUrl}/events/${id}`, {
      headers: this.getHeaders()
    });
  }

  createEvent(eventData: any): Observable<ApiResponse<Event>> {
    return this.http.post<ApiResponse<Event>>(`${this.apiUrl}/events`, eventData, {
      headers: this.getHeaders()
    });
  }

  updateEvent(id: string, eventData: any): Observable<ApiResponse<Event>> {
    return this.http.put<ApiResponse<Event>>(`${this.apiUrl}/events/${id}`, eventData, {
      headers: this.getHeaders()
    });
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Event Registration Methods
registerForEvent(eventId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/registrations/register`, 
    { eventId }, 
    { headers: this.getHeaders() }
  );
}

getMyRegistrations(): Observable<any> {
  return this.http.get(`${this.apiUrl}/registrations/my-registrations`, {
    headers: this.getHeaders()
  });
}

cancelRegistration(eventId: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/registrations/${eventId}`, {
    headers: this.getHeaders()
  });
}

  // ===== SUBMISSIONS (STUDENT) =====
  submitProof(submissionData: any): Observable<ApiResponse<Submission>> {
    return this.http.post<ApiResponse<Submission>>(`${this.apiUrl}/submissions`, submissionData, {
      headers: this.getHeaders()
    });
  }

  getMySubmissions(): Observable<ApiResponse<Submission[]>> {
    return this.http.get<ApiResponse<Submission[]>>(`${this.apiUrl}/submissions/my-submissions`, {
      headers: this.getHeaders()
    });
  }

  // ===== ADMIN ENDPOINTS =====
  
  /**
   * Get all NGOs for event creation dropdown
   * CO3: Admin route for NGO selection
   */
  getNgos(): Observable<ApiResponse<Ngo[]>> {
    return this.http.get<ApiResponse<Ngo[]>>(`${this.apiUrl}/admin/ngos`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get dashboard statistics
   * CO3: Admin analytics endpoint
   */
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard-stats`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get pending submissions for review
   * CO3: Admin submission management
   */
  getPendingSubmissions(): Observable<ApiResponse<Submission[]>> {
    return this.http.get<ApiResponse<Submission[]>>(`${this.apiUrl}/admin/submissions/pending`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Review (approve/reject) a submission
   * CO3: Admin review with automated point calculation
   */
  reviewSubmission(submissionId: string, reviewData: any): Observable<ApiResponse<Submission>> {
    return this.http.patch<ApiResponse<Submission>>(
      `${this.apiUrl}/admin/submissions/${submissionId}/review`,
      reviewData,
      { headers: this.getHeaders() }
    );
  }
}