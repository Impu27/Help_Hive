/**
 * Custom Email Domain Validator
 * CO1: Form validation for registration
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Allowed email domains - must match backend config
const ALLOWED_EMAIL_DOMAINS = ['gmail.com', 'rvce.edu.in', 'helphive.com'];

/**
 * Extract domain from email address
 * @param email - Email address
 * @returns Domain part of email (e.g., 'gmail.com')
 */
function extractEmailDomain(email: string): string {
  if (!email) return '';
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Custom validator: Check if email domain is in allowed list
 * Usage: email: ['', [Validators.email, allowedEmailDomainValidator()]]
 * 
 * @returns ValidatorFn - Validator function for Angular forms
 */
export function allowedEmailDomainValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const email = control.value;

    // Don't validate if empty (let required validator handle it)
    if (!email) {
      return null;
    }

    const domain = extractEmailDomain(email);

    // Check if domain is in allowed list
    if (domain && ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return null; // Valid
    }

    // Return error object with domain information
    return {
      allowedEmailDomain: {
        invalid: true,
        domain: domain,
        message: 'Only Gmail, RVCE, or Help-Hive email IDs are allowed'
      }
    };
  };
}

/**
 * Get allowed domains as a comma-separated string (for display)
 * @returns String of allowed domains
 */
export function getAllowedDomainsDisplay(): string {
  return ALLOWED_EMAIL_DOMAINS.join(', ');
}
