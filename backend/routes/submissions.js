const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Event = require('../models/Event');
const { authMiddleware, studentOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/submissions
 * @desc    Submit proof for an event (Student)
 * @access  Private (Student)
 */
router.post('/', authMiddleware, studentOnly, upload.single('proofFile'), async (req, res) => {
  try {
    const { eventId, proofType } = req.body;

    let proofData;
    if (req.file) {
      proofData = `/uploads/${req.file.filename}`;
    } else if (req.body.proofData) {
      proofData = req.body.proofData;
    }

    if (!eventId || !proofData) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId and proof (file or data)'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only submit proof for completed events'
      });
    }

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

    const submission = await Submission.create({
      student: req.user.id,
      event: eventId,
      proofType: req.file ? 'file' : (proofType || 'text'), 
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
 * @route    GET /api/submissions/my-submissions
 * @desc     Get all submissions for logged-in student
 * @access   Private (Student)
 */
router.get('/my-submissions', authMiddleware, studentOnly, async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate('event', 'title pointsAwarded eventDate activityType')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    // Added the DEBUG log from your snippet
    console.log(`Found ${submissions.length} submissions for user ${req.user.id}`); 

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