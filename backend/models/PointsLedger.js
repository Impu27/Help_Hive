/**
 * PointsLedger Model
 * CO2: Audit trail for all point transactions
 */

const mongoose = require('mongoose');
const { HOURS_PER_POINT } = require('../config/constants');

const pointsLedgerSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event reference is required']
  },
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  },
  pointsEarned: {
    type: Number,
    required: [true, 'Points earned is required']
  },
  hoursEarned: {
    type: Number,
    default: 0,
    min: [0, 'Hours cannot be negative']
  },
  transactionType: {
    type: String,
    enum: ['credit', 'debit', 'adjustment'],
    default: 'credit'
  },
  notes: {
    type: String,
    trim: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for reporting
pointsLedgerSchema.index({ student: 1, createdAt: -1 });
pointsLedgerSchema.index({ event: 1 });

// ✅ Pre-save hook: Auto-calculate hours earned
pointsLedgerSchema.pre('save', function(next) {
  if (this.transactionType === 'credit') {
    this.hoursEarned = this.pointsEarned * HOURS_PER_POINT;
  }
  next();
});

module.exports = mongoose.model('PointsLedger', pointsLedgerSchema);