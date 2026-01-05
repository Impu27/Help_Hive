import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    let storedUser: User | null = null;

    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      //  Restore session ONLY if BOTH user and token exist
      if (userStr && token) {
        try {
          storedUser = JSON.parse(userStr);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } else {
        // Remove stale or incomplete session data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  setUser(user: User, token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    }
    this.currentUserSubject.next(user);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  isStudent(): boolean {
    return this.currentUserValue?.role === 'student';
  }
}