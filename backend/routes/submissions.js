const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Registration = require('../models/Registration');
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

    console.log('=== SUBMISSION REQUEST ===');
    console.log('Student ID:', req.user.id);
    console.log('Event ID:', eventId);
    console.log('Proof Type:', proofType);
    console.log('Has File:', !!req.file);
    console.log('File details:', req.file ? { name: req.file.filename, size: req.file.size } : 'No file');

    let proofData;
    if (req.file) {
      proofData = `/uploads/${req.file.filename}`;
    } else if (req.body.proofData) {
      proofData = req.body.proofData;
    }

    console.log('Proof Data:', proofData);

    if (!eventId || !proofData) {
      console.log('Validation failed: Missing eventId or proofData');
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId and proof (file or data)'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    console.log('Event found:', event.title, 'Status:', event.status);

    if (event.status !== 'completed') {
      console.log('Event status is not completed:', event.status);
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
      console.log('Submission already exists for this student and event');
      return res.status(400).json({
        success: false,
        message: 'You have already submitted proof for this event'
      });
    }

    // ✅ Fetch semester from Registration record (historical accuracy)
    const registration = await Registration.findOne({
      student: req.user.id,
      event: eventId
    });

    if (!registration) {
      console.log('Registration not found for student:', req.user.id, 'event:', eventId);
      return res.status(400).json({
        success: false,
        message: 'Registration not found. You must be registered for this event to submit proof.'
      });
    }

    console.log('Registration found. Semester:', registration.semester);

    const submission = await Submission.create({
      student: req.user.id,
      event: eventId,
      semester: registration.semester,
      proofType: req.file ? 'image' : proofType, 
      proofData,
      status: 'pending'
    });

    console.log('Submission created:', submission._id);

    // ✅ Populate event with points AND hours for display
    await submission.populate('event', 'title pointsAwarded hoursEquivalent');

    res.status(201).json({
      success: true,
      message: 'Proof submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Submit proof error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting proof',
      error: error.toString()
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
      .populate('event', 'title pointsAwarded hoursEquivalent eventDate activityType')
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