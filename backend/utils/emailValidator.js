/**
 * Email Validation Utilities
 * CO3: Input validation for registration
 */

const { ALLOWED_EMAIL_DOMAINS } = require('../config/constants');

/**
 * Extract domain from email address
 * @param {string} email - Email address
 * @returns {string} - Domain part of email (e.g., 'gmail.com')
 */
function extractDomain(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.toLowerCase().split('@')[1] || '';
}

/**
 * Check if email domain is allowed
 * @param {string} email - Email address to validate
 * @returns {object} - { isValid: boolean, domain: string, message: string }
 */
function isAllowedDomain(email) {
  const domain = extractDomain(email);

  if (!domain) {
    return {
      isValid: false,
      domain: '',
      message: 'Invalid email format'
    };
  }

  const isValid = ALLOWED_EMAIL_DOMAINS.includes(domain);

  if (!isValid) {
    return {
      isValid: false,
      domain,
      message: 'Only Gmail, RVCE, or Help-Hive email IDs are allowed'
    };
  }

  return {
    isValid: true,
    domain,
    message: 'Email domain is allowed'
  };
}

/**
 * Validate email for registration
 * @param {string} email - Email to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
function validateEmailForRegistration(email) {
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address'
    };
  }

  // Check if domain is allowed
  const domainCheck = isAllowedDomain(email);
  return {
    isValid: domainCheck.isValid,
    message: domainCheck.message
  };
}

module.exports = {
  extractDomain,
  isAllowedDomain,
  validateEmailForRegistration
};
