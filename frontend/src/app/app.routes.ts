// ===== src/app/app.routes.ts =====
/**
 * App Routes Configuration
 * CO1: Role-based navigation with guards
 */

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent) 
  },
  
  // Student Routes
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' },
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./student/dashboard/dashboard').then(m => m.DashboardComponent) 
      },
      { 
        path: 'events', 
        loadComponent: () => import('./student/event-list/event-list').then(m => m.EventListComponent) 
      },
      { 
        path: 'points', 
        loadComponent: () => import('./student/points-tracker/points-tracker').then(m => m.PointsTrackerComponent) 
      }
    ]
  },

  // Admin Routes
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./admin/dashboard/dashboard.admin-dashboard').then(m => m.AdminDashboardComponent) 
      },
      { 
        path: 'create-event', 
        loadComponent: () => import('./admin/create-event/create-event').then(m => m.CreateEventComponent) 
      },
      { 
        path: 'review-submissions', 
        loadComponent: () => import('./admin/review-submissions/review-submissions').then(m => m.ReviewSubmissionsComponent) 
      }
    ]
  },

  // Wildcard
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];