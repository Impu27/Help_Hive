// ===== backend/routes/admin.js =====
/**
 * Admin Routes
 * CO3: Admin-specific operations (review submissions, manage points)
 */

const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const PointsLedger = require('../models/PointsLedger');
const User = require('../models/User');
const Event = require('../models/Event');
const Ngo = require('../models/Ngo');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/**
 * @route   GET /api/admin/submissions/pending
 * @desc    Get all pending submissions for review
 * @access  Private (Admin)
 * @CO      CO3 - REST API
 */
router.get('/submissions/pending', authMiddleware, adminOnly, async (req, res) => {
  try {
    const submissions = await Submission.find({ status: 'pending' })
      .populate('student', 'name email studentId')
      .populate('event', 'title pointsAwarded activityType')
      .sort({ createdAt: 1 }); // Oldest first

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });

  } catch (error) {
    console.error('Get pending submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   PATCH /api/admin/submissions/:id/review
 * @desc    Approve or reject a submission
 * @access  Private (Admin)
 * @CO      CO3 - REST API with automated point calculation
 */
router.patch('/submissions/:id/review', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    // Validation
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    // Find submission
    const submission = await Submission.findById(req.params.id)
      .populate('event')
      .populate('student');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Submission has already been reviewed'
      });
    }

    // Update submission
    submission.status = status;
    submission.reviewedBy = req.user.id;
    submission.reviewDate = new Date();
    submission.reviewNotes = reviewNotes || '';
    await submission.save();

    // If approved, award points - CO3: Automated point calculation
    if (status === 'approved') {
      const pointsEarned = submission.event.pointsAwarded;

      // Create points ledger entry
      await PointsLedger.create({
        student: submission.student._id,
        event: submission.event._id,
        submission: submission._id,
        pointsEarned,
        transactionType: 'credit',
        notes: `Approved submission for event: ${submission.event.title}`,
        processedBy: req.user.id
      });

      // Update student's total points
      await User.findByIdAndUpdate(
        submission.student._id,
        { $inc: { totalPoints: pointsEarned } }
      );
    }

    res.json({
      success: true,
      message: `Submission ${status} successfully`,
      data: submission
    });

  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing submission'
    });
  }
});

/**
 * @route   GET /api/admin/ngos
 * @desc    Get all NGOs for event creation dropdown
 * @access  Private (Admin)
 * @CO      CO3 - REST API
 */
router.get('/ngos', authMiddleware, adminOnly, async (req, res) => {
  try {
    const ngos = await Ngo.find({ isVerified: true })
      .select('name causes aicteActivities')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: ngos.length,
      data: ngos
    });

  } catch (error) {
    console.error('Get NGOs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 * @CO      CO3 - REST API with aggregation
 */
router.get('/dashboard-stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [
      totalStudents,
      totalEvents,
      pendingSubmissions,
      approvedSubmissions,
      totalPointsAwarded
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Event.countDocuments(),
      Submission.countDocuments({ status: 'pending' }),
      Submission.countDocuments({ status: 'approved' }),
      PointsLedger.aggregate([
        { $group: { _id: null, total: { $sum: '$pointsEarned' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalEvents,
        pendingSubmissions,
        approvedSubmissions,
        totalPointsAwarded: totalPointsAwarded[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;