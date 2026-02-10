// ===== backend/routes/admin.js =====
/**
 * Admin Routes
 * CO3: Admin-specific operations (review submissions, manage points)
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const PointsLedger = require('../models/PointsLedger');
const User = require('../models/User');
const Event = require('../models/Event');
const Ngo = require('../models/Ngo');
const { authMiddleware, adminOnly, adminRole } = require('../middleware/auth');


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
      .populate('event', 'title pointsAwarded hoursEquivalent activityType')
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

      // ✅ Create points ledger entry with hours (hoursEarned auto-calculated by pre-save hook)
      const ledgerEntry = await PointsLedger.create({
        student: submission.student._id,
        event: submission.event._id,
        submission: submission._id,
        pointsEarned,
        transactionType: 'credit',
        notes: `Approved submission for event: ${submission.event.title}`,
        processedBy: req.user.id
      });

      console.log(`Points awarded - Student: ${submission.student._id} | Points: ${pointsEarned} | Hours: ${ledgerEntry.hoursEarned}`);

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
 * @access  Private (Admin, Mentor)
 * @CO      CO3 - REST API
 */
router.get('/ngos', authMiddleware, async (req, res) => {
  try {
    console.log('📨 GET /admin/ngos - User:', req.user.email, 'Role:', req.user.role);
    
    // Allow both admin and mentor roles
    if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
      console.log('❌ Access denied for role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin or Mentor privileges required'
      });
    }
    
    // Check total NGOs in database
    const totalNgos = await Ngo.countDocuments();
    console.log('📊 Total NGOs in DB:', totalNgos);
    
    // Check verified NGOs
    const verifiedCount = await Ngo.countDocuments({ isVerified: true });
    console.log('📊 Verified NGOs in DB:', verifiedCount);
    
    const ngos = await Ngo.find({ isVerified: true })
      .select('_id name causes aicteActivities')
      .sort({ name: 1 });

    console.log(`✅ Returning ${ngos.length} verified NGOs`);
    if (ngos.length > 0) {
      console.log('📋 First NGO:', ngos[0]);
    }

    res.json({
      success: true,
      count: ngos.length,
      data: ngos
    });

  } catch (error) {
    console.error('❌ Get NGOs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
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

/**
 * @route   GET /api/admin/mentors
 * @desc    Get all mentor accounts
 * @access  Private (Admin)
 * @CO      CO3 - REST API
 */
router.get('/mentors', authMiddleware, adminOnly, async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor' })
      .select('_id name email phone isActive')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: mentors.length,
      data: mentors
    });

  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/admin/students
 * @desc    Get all student accounts
 * @access  Private (Admin)
 * @CO      CO3 - REST API
 */
router.get('/students', authMiddleware, adminOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('_id name email studentId mentor totalPoints isActive')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/admin/mentors/:mentorId/students
 * @desc    Get all students assigned to a mentor
 * @access  Private (Admin)
 * @CO      CO3 - REST API with filtering
 */
router.get('/mentors/:mentorId/students', authMiddleware, adminOnly, async (req, res) => {
  try {
    const mentorId = new mongoose.Types.ObjectId(req.params.mentorId);

    // Verify mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Get all students assigned to this mentor
    const students = await User.find({ mentor: mentorId, role: 'student' })
      .select('_id name email studentId totalPoints isActive')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Get mentor students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   POST /api/admin/mentors/:mentorId/assign-students
 * @desc    Assign multiple students to a mentor
 * @access  Private (Admin)
 * @CO      CO3 - REST API with bulk operations
 */
router.post('/mentors/:mentorId/assign-students', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { studentIds } = req.body;
    const mentorId = new mongoose.Types.ObjectId(req.params.mentorId);
    
    console.log(`📍 Assigning students to mentor`);
    console.log(`   Mentor ID: ${mentorId.toString()}`);
    console.log(`   Student IDs: ${studentIds.join(', ')}`);

    // Validation
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }

    // Verify mentor exists and is actually a mentor
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      console.error(`❌ Mentor not found or not a mentor: ${mentorId}`);
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }
    
    console.log(`✅ Found mentor: ${mentor.name} (${mentor._id})`);

    // Convert studentIds to ObjectIds
    const objectIds = studentIds.map(id => new mongoose.Types.ObjectId(id));

    // Verify all students exist
    const students = await User.find({ _id: { $in: objectIds }, role: 'student' });
    if (students.length !== studentIds.length) {
      console.warn(`⚠️  Only found ${students.length} students out of ${studentIds.length} requested`);
      return res.status(400).json({
        success: false,
        message: `Only ${students.length} out of ${studentIds.length} students found`
      });
    }
    
    console.log(`✅ Found all ${students.length} students`);

    // Assign students to mentor
    const result = await User.updateMany(
      { _id: { $in: objectIds }, role: 'student' },
      { $set: { mentor: mentorId } }
    );

    console.log(`✅ Updated ${result.modifiedCount} student records with mentor ID ${mentorId.toString()}`);
    
    // Verify the assignment
    const verifyCount = await User.countDocuments({ _id: { $in: objectIds }, mentor: mentorId, role: 'student' });
    console.log(`🔍 Verification: ${verifyCount} students now have mentor field set to ${mentorId.toString()}`);

    res.json({
      success: true,
      message: `Successfully assigned ${result.modifiedCount} students to ${mentor.name}`,
      data: {
        mentorId: mentorId.toString(),
        mentorName: mentor.name,
        assignedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Assign students error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

/**
 * @route   DELETE /api/admin/mentors/:mentorId/students/:studentId
 * @desc    Remove a student from a mentor
 * @access  Private (Admin)
 * @CO      CO3 - REST API with ownership validation
 */
router.delete('/mentors/:mentorId/students/:studentId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const mentorId = new mongoose.Types.ObjectId(req.params.mentorId);
    const studentId = new mongoose.Types.ObjectId(req.params.studentId);

    // Verify mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Verify student exists and is assigned to this mentor
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.mentor.toString() !== mentorId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Student is not assigned to this mentor'
      });
    }

    // Remove mentor assignment
    const result = await User.findByIdAndUpdate(
      studentId,
      { $set: { mentor: null } },
      { new: true }
    );

    console.log(`✅ Removed ${result.name} from mentor ${mentor.name}`);

    res.json({
      success: true,
      message: `Successfully removed ${result.name} from ${mentor.name}`,
      data: {
        studentId,
        studentName: result.name,
        mentorId,
        mentorName: mentor.name
      }
    });

  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;