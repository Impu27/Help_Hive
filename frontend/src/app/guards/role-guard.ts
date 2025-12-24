// ===== src/app/guards/role.guard.ts =====
/**
 * Role Guard - Checks user role for route access
 * CO1: Role-based access control
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const requiredRole = route.data['role'];
  const user = authService.currentUserValue;

  if (user && user.role === requiredRole) {
    return true;
  }

  // Redirect based on current role
  if (user?.role === 'student') {
    router.navigate(['/student/dashboard']);
  } else if (user?.role === 'admin') {
    router.navigate(['/admin/dashboard']);
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};
