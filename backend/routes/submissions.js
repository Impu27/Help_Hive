// ===== backend/routes/submissions.js =====
/**
 * Submission Routes
 * CO3: Student proof submission and tracking
 */

const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Event = require('../models/Event');
const { authMiddleware, studentOnly } = require('../middleware/auth');

/**
 * @route   POST /api/submissions
 * @desc    Submit proof for an event (Student)
 * @access  Private (Student)
 * @CO      CO3 - REST API with business logic
 */
router.post('/', authMiddleware, studentOnly, async (req, res) => {
  try {
    const { eventId, proofType, proofData } = req.body;

    // Validation
    if (!eventId || !proofType || !proofData) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId, proofType, and proofData'
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

    // Check if event is completed
    if (event.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only submit proof for completed events'
      });
    }

    // Check for duplicate submission
    const existingSubmission = await Submission.findOne({
      student: req.user.id,
      event: eventId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted proof for this event'
      });
    }

    // Create submission
    const submission = await Submission.create({
      student: req.user.id,
      event: eventId,
      proofType,
      proofData,
      status: 'pending'
    });

    await submission.populate('event', 'title pointsAwarded');

    res.status(201).json({
      success: true,
      message: 'Proof submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Submit proof error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting proof'
    });
  }
});

/**
 * @route   GET /api/submissions/my-submissions
 * @desc    Get all submissions for logged-in student
 * @access  Private (Student)
 * @CO      CO3 - REST API, CO4 - Frontend integration
 */
router.get('/my-submissions', authMiddleware, studentOnly, async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate('event', 'title pointsAwarded eventDate activityType')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions'
    });
  }
});

module.exports = router;