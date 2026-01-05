// ===== src/app/guards/auth.guard.ts =====
/**
 * Auth Guard - Protects routes requiring authentication
 * CO1: Role-based navigation
 */

// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUserValue;

  if (user) {
    return true;
  }

  // IMPORTANT: return UrlTree, not navigate()
  return router.createUrlTree(['/login']);
};


