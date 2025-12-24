/**
 * Submission Model
 * CO2: Schema for student proof submissions
 */

const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
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
  proofType: {
    type: String,
    enum: ['url', 'image'],
    required: [true, 'Proof type is required']
  },
  proofData: {
    type: String,
    required: [true, 'Proof data is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index: Prevent duplicate submissions for same event
submissionSchema.index({ student: 1, event: 1 }, { unique: true });

// Indexes for queries
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ student: 1 });

module.exports = mongoose.model('Submission', submissionSchema);