/**
 * Application Constants Configuration
 * Centralized configuration for conversion rates and system parameters
 */

module.exports = {
  // AICTE Activity Point to Volunteering Hours Conversion
  // Based on AICTE guidelines: Each activity point = 4 hours of volunteering
  HOURS_PER_POINT: 4,

  // Event status values
  EVENT_STATUS: {
    UPCOMING: 'upcoming',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Submission status values
  SUBMISSION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },

  // Points ledger transaction types
  TRANSACTION_TYPE: {
    CREDIT: 'credit',
    DEBIT: 'debit',
    ADJUSTMENT: 'adjustment'
  }
};
