// ===== BACKEND: Add Registration Routes =====
// backend/routes/registrations.js (NEW FILE)

const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { authMiddleware, studentOnly } = require('../middleware/auth');

/**
 * @route   POST /api/registrations/register
 * @desc    Student registers for an event
 * @access  Private (Student)
 */
router.post('/register', authMiddleware, studentOnly, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is full
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Event is full. No more spots available.'
      });
    }

    // Check if student already registered
    const existingRegistration = await Registration.findOne({
      student: req.user.id,
      event: eventId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Create registration
    const registration = await Registration.create({
      student: req.user.id,
      event: eventId,
      status: 'registered'
    });

    // Increment event participant count
    await Event.findByIdAndUpdate(eventId, {
      $inc: { currentParticipants: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: registration
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/registrations/my-registrations
 * @desc    Get student's registered events
 * @access  Private (Student)
 */
router.get('/my-registrations', authMiddleware, studentOnly, async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user.id })
      .populate('event')
      .sort({ registrationDate: -1 });

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   DELETE /api/registrations/:eventId
 * @desc    Cancel registration (before event)
 * @access  Private (Student)
 */
router.delete('/:eventId', authMiddleware, studentOnly, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      student: req.user.id,
      event: req.params.eventId
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Decrement participant count
    await Event.findByIdAndUpdate(req.params.eventId, {
      $inc: { currentParticipants: -1 }
    });

    await registration.deleteOne();

    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;