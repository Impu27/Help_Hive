import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  Event,
  Submission,
  Ngo,
  DashboardStats   // ✅ ADDED
} from '../models/interfaces';

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
   * Helper to get headers.
   * @param isFormData If true, Content-Type is omitted so the browser sets the boundary.
   */
  private getHeaders(isFormData: boolean = false): HttpHeaders {
    let token = '';
    
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token') || '';
    }

    const headersConfig: any = {};

    // IMPORTANT: Do NOT set Content-Type for FormData
    if (!isFormData) {
      headersConfig['Content-Type'] = 'application/json';
    }

    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headersConfig);
  }

  // ================= AUTH =================
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

  // ================= EVENTS =================
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

  // ================= EVENT REGISTRATIONS =================
  registerForEvent(eventId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/registrations/register`,
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

  // ================= SUBMISSIONS (STUDENT) =================
  /**
   * Submit proof using Multipart FormData (supports file upload)
   */
  submitProofWithFile(formData: FormData): Observable<ApiResponse<Submission>> {
    return this.http.post<ApiResponse<Submission>>(
      `${this.apiUrl}/submissions`,
      formData,
      { headers: this.getHeaders(true) } // ✅ FormData-safe
    );
  }

  // Fallback JSON submission (optional)
  submitProof(submissionData: any): Observable<ApiResponse<Submission>> {
    return this.http.post<ApiResponse<Submission>>(
      `${this.apiUrl}/submissions`,
      submissionData,
      { headers: this.getHeaders() }
    );
  }

  getMySubmissions(): Observable<ApiResponse<Submission[]>> {
    return this.http.get<ApiResponse<Submission[]>>(
      `${this.apiUrl}/submissions/my-submissions`,
      { headers: this.getHeaders() }
    );
  }

  // ================= ADMIN =================
  getNgos(): Observable<ApiResponse<Ngo[]>> {
    return this.http.get<ApiResponse<Ngo[]>>(`${this.apiUrl}/admin/ngos`, {
      headers: this.getHeaders()
    });
  }

  getPendingSubmissions(): Observable<ApiResponse<Submission[]>> {
    return this.http.get<ApiResponse<Submission[]>>(
      `${this.apiUrl}/admin/submissions/pending`,
      { headers: this.getHeaders() }
    );
  }

  reviewSubmission(
    submissionId: string,
    reviewData: any
  ): Observable<ApiResponse<Submission>> {
    return this.http.patch<ApiResponse<Submission>>(
      `${this.apiUrl}/admin/submissions/${submissionId}/review`,
      reviewData,
      { headers: this.getHeaders() }
    );
  }

  // ================= ADMIN: CREATE EVENT =================
createEvent(eventData: Partial<Event>): Observable<ApiResponse<Event>> {
  return this.http.post<ApiResponse<Event>>(
    `${this.apiUrl}/events`,
    eventData,
    { headers: this.getHeaders() }
  );
}

  // ================= ADMIN DASHBOARD STATS =================
  /**
   * Fetch admin dashboard statistics
   */
  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(
      `${this.apiUrl}/admin/dashboard-stats`,
      { headers: this.getHeaders() }
    );
  }
}
