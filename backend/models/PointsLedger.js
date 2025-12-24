/**
 * PointsLedger Model
 * CO2: Audit trail for all point transactions
 */

const mongoose = require('mongoose');

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

module.exports = mongoose.model('PointsLedger', pointsLedgerSchema);