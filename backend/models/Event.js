/**
 * Event Model
 * CO2: MongoDB schema for volunteer events
 */

const mongoose = require('mongoose');

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
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
eventSchema.index({ status: 1, eventDate: -1 });
eventSchema.index({ ngo: 1 });
eventSchema.index({ createdBy: 1 });

// Virtual to check if event is full
eventSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

module.exports = mongoose.model('Event', eventSchema);