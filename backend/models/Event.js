/**
 * Event Model
 * CO2: MongoDB schema for volunteer events
 */

const mongoose = require('mongoose');
const { HOURS_PER_POINT } = require('../config/constants');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true
  },
  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ngo',
    required: [true, 'NGO reference is required']
  },
  activityType: {
    type: String,
    enum: ['Community Service', 'Environmental', 'Education', 'Healthcare', 'Other'],
    required: [true, 'Activity type is required']
  },
  pointsAwarded: {
    type: Number,
    required: [true, 'Points awarded is required'],
    min: [1, 'Points must be at least 1'],
    max: [100, 'Points cannot exceed 100']
  },
  hoursEquivalent: {
    type: Number,
    default: 0,
    min: [0, 'Hours cannot be negative']
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  eventEndDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  maxParticipants: {
    type: Number,
    default: 50,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'mentor'],
    default: 'admin'
  },
  createdForMentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
    // Only set if event is mentor-scoped
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
eventSchema.index({ status: 1, eventDate: -1 });
eventSchema.index({ ngo: 1 });
eventSchema.index({ createdBy: 1 });

// ✅ Pre-save hook: Auto-calculate hours equivalent
eventSchema.pre('save', function(next) {
  // Calculate hours based on points awarded
  this.hoursEquivalent = this.pointsAwarded * HOURS_PER_POINT;
  next();
});

// Virtual to check if event is full
eventSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

module.exports = mongoose.model('Event', eventSchema);