// ===== src/app/guards/role.guard.ts =====
/**
 * Role Guard - Checks user role for route access
 * CO1: Role-based access control
 */

// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'];
  const user = authService.currentUserValue;

  // Allow if role matches
  if (user && user.role === requiredRole) {
    return true;
  }

  // Redirect safely based on role
  if (user?.role === 'student') {
    return router.createUrlTree(['/student/dashboard']);
  }

  if (user?.role === 'mentor') {
    return router.createUrlTree(['/mentor/dashboard']);
  }

  if (user?.role === 'admin') {
    return router.createUrlTree(['/admin/dashboard']);
  }

  // Fallback
  return router.createUrlTree(['/login']);
};
