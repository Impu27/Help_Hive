// ===== src/app/app.routes.ts =====
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // ✅ Redirects /student to /student/dashboard
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

  // Mentor Routes
  {
    path: 'mentor',
    canActivate: [authGuard, roleGuard],
    data: { role: 'mentor' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./mentor/dashboard/dashboard.mentor-dashboard').then(m => m.MentorDashboardComponent) 
      },
      { 
        path: 'events', 
        loadComponent: () => import('./mentor/events/mentor-events').then(m => m.MentorEventsComponent) 
      },
      { 
        path: 'create-event', 
        loadComponent: () => import('./mentor/create-event/mentor-create-event').then(m => m.MentorCreateEventComponent) 
      },
      { 
        path: 'review-submissions', 
        loadComponent: () => import('./mentor/review-submissions/mentor-review-submissions').then(m => m.MentorReviewSubmissionsComponent) 
      }
    ]
  },

  // Admin Routes
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // ✅ Redirects /admin to /admin/dashboard
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
      },
      { 
        path: 'manage-mentors', 
        loadComponent: () => import('./admin/manage-mentors/manage-mentors').then(m => m.ManageMentorsComponent) 
      }
    ]
  },

  // Wildcard
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];