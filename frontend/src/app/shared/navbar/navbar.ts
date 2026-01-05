// ===== src/app/shared/navbar/navbar.component.ts =====
/**
 * Navbar Component
 * CO1: Role-based dynamic navigation
 * FIX: Hide navbar on login/register + prevent double-click routing issue
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/interfaces';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {

  currentUser: User | null = null;
  isMenuOpen = false;

  /** 👇 KEY FIX FLAG */
  hideNavbar = false;

  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    /* -------------------------
     * AUTH STATE
     * ------------------------- */
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    /* -------------------------
     * ROUTE AWARENESS (CRITICAL FIX)
     * ------------------------- */
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;

        // Hide navbar ONLY on auth pages
        this.hideNavbar =
          url.startsWith('/login') ||
          url.startsWith('/register');

        // Always close menu on navigation
        this.isMenuOpen = false;
      });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.isMenuOpen = false;
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
