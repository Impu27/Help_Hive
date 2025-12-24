/**
 * NGO Model
 * CO2: MongoDB schema for NGO organizations
 * Data imported from Finalbengaluru_ngos.csv
 */

const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'NGO name is required'],
    trim: true
  },
  officialWebsite: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  causes: [{
    type: String,
    trim: true
  }],
  aicteActivities: [{
    type: String,
    trim: true
  }],
  isVerified: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for searching NGOs
ngoSchema.index({ name: 'text', causes: 'text' });

module.exports = mongoose.model('Ngo', ngoSchema);