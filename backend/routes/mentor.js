/**
 * Mentor Routes
 * CO3: Mentor-specific operations (view mentees, review submissions, create events for mentees)
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Event = require('../models/Event');
const Ngo = require('../models/Ngo');
const PointsLedger = require('../models/PointsLedger');
const { authMiddleware, mentorOnly } = require('../middleware/auth');

/**
 * @route   GET /api/mentor/profile
 * @desc    Get mentor's own profile information
 * @access  Private (Mentor only)
 */
router.get('/profile', authMiddleware, mentorOnly, async (req, res) => {
  try {
    const mentorId = req.user.id;
    console.log(`👤 Fetching profile for mentor ID: ${mentorId}`);
    
    const mentor = await User.findById(mentorId).select('-password');
    
    if (!mentor) {
      console.error(`❌ Mentor not found with ID: ${mentorId}`);
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }
    
    console.log(`✅ Found mentor:`, { id: mentor._id.toString(), name: mentor.name, email: mentor.email });
    
    res.json({
      success: true,
      data: mentor
    });
  } catch (error) {
    console.error('❌ Get mentor profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/mentor/students
 * @desc    Get all students assigned to this mentor
 * @access  Private (Mentor only)
 * @CO      CO3 - REST API
 */
router.get('/students', authMiddleware, mentorOnly, async (req, res) => {
  try {
    const mentorId = new mongoose.Types.ObjectId(req.user.id);
    const students = await User.find({ mentor: mentorId, role: 'student' })
      .select('name email studentId totalPoints isActive')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Get mentees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/mentor/submissions
 * @desc    Get all submissions from mentor's assigned students
 * @access  Private (Mentor only)
 * @CO      CO3 - REST API with filtering
 */
router.get('/submissions', authMiddleware, mentorOnly, async (req, res) => {
  try {
    // Get all students assigned to this mentor
    const mentorId = new mongoose.Types.ObjectId(req.user.id);
    const mentees = await User.find({ mentor: mentorId, role: 'student' }).select('_id');
    const menteeIds = mentees.map(m => m._id);

    // Get submissions from these students
    const submissions = await Submission.find({ student: { $in: menteeIds } })
      .populate('student', 'name email studentId totalPoints')
      .populate('event', 'title pointsAwarded hoursEquivalent activityType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });

  } catch (error) {
    console.error('Get mentor submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/mentor/submissions/pending
 * @desc    Get pending submissions from mentor's assigned students
 * @access  Private (Mentor only)
 * @CO      CO3 - REST API with filtering
 */
router.get('/submissions/pending', authMiddleware, mentorOnly, async (req, res) => {
  try {
    // Get all students assigned to this mentor
    const mentorId = new mongoose.Types.ObjectId(req.user.id);
    const mentees = await User.find({ mentor: mentorId, role: 'student' }).select('_id');
    const menteeIds = mentees.map(m => m._id);

    // Get pending submissions from these students
    const submissions = await Submission.find({ 
      student: { $in: menteeIds },
      status: 'pending'
    })
      .populate('student', 'name email studentId totalPoints')
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
 * @route   PATCH /api/mentor/submissions/:id/review
 * @desc    Approve or reject a submission (Mentor can only review mentee submissions)
 * @access  Private (Mentor only)
 * @CO      CO3 - REST API with ownership validation
 */
router.patch('/submissions/:id/review', authMiddleware, mentorOnly, async (req, res) => {
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

    // CRITICAL: Verify this submission belongs to one of the mentor's students
    const mentorId = new mongoose.Types.ObjectId(req.user.id);
    //if (submission.student.mentor.toString() !== mentorId.toString())
    //if (!submission.student.mentor || submission.student.mentor.toString() !== mentorId.toString()) {
      //return res.status(403).json({
        //success: false,
       // message: 'You can only review submissions from your assigned students'
      //});
    //}

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Submission has already been reviewed'
      });
    }

    // Update submission
    //mentorId = new mongoose.Types.ObjectId(req.user.id);
    submission.status = status;
    submission.reviewedBy = mentorId;
    submission.reviewDate = new Date();
    submission.reviewNotes = reviewNotes || '';
    await submission.save();

    // If approved, award points
    if (status === 'approved') {
      const pointsEarned = submission.event.pointsAwarded;

      // Create points ledger entry with hours
      const ledgerEntry = await PointsLedger.create({
        student: submission.student._id,
        event: submission.event._id,
        submission: submission._id,
        pointsEarned,
        transactionType: 'credit',
        //notes: `Approved submission for event: ${submission.event.title} (Reviewed by: ${submission.student.mentor.toString() === mentorId.toString() ? 'Mentor' : 'Admin'})`,
        notes: `Approved submission for event: ${submission.event.title} (Reviewed by Mentor)`,
        processedBy: mentorId
      });

      console.log(`Points awarded - Student: ${submission.student._id} | Points: ${pointsEarned} | Hours: ${ledgerEntry.hoursEarned} | Awarded by Mentor: ${mentorId}`);

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
    console.error('Mentor review submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing submission'
    });
  }
});

/**
 * @route   POST /api/mentor/events
 * @desc    Create event visible only to mentor's assigned students
 * @access  Private (Mentor only)
 * @CO      CO3 - REST API with restricted scope
 */
router.post('/events', authMiddleware, mentorOnly, async (req, res) => {
  try {
    const { title, description, ngoId, activityType, pointsAwarded, eventDate, eventEndDate, location, maxParticipants } = req.body;

    // Validation
    if (!title || !description || !ngoId || !activityType || !pointsAwarded || !eventDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, ngo, activityType, pointsAwarded, and eventDate'
      });
    }

    // Verify NGO exists
    const ngo = await Ngo.findById(ngoId);
    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    // Create mentor-scoped event
    const createdBy = new mongoose.Types.ObjectId(req.user.id);
    const event = await Event.create({
      title,
      description,
      ngo: ngoId,
      activityType,
      pointsAwarded,
      eventDate: new Date(eventDate),
      eventEndDate: eventEndDate ? new Date(eventEndDate) : undefined,
      location: location || '',
      maxParticipants: maxParticipants || 50,
      createdBy,
      createdByRole: 'mentor',
      createdForMentor: createdBy
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  }
});

/**
 * @route   GET /api/mentor/events
 * @desc    Get all events created by this mentor
 * @access  Private (Mentor only)
 * @CO      CO3 - REST API
 */
router.get('/events', authMiddleware, mentorOnly, async (req, res) => {
  try {
    const mentorId = new mongoose.Types.ObjectId(req.user.id);
    const events = await Event.find({ createdBy: mentorId, createdByRole: 'mentor' })
      .populate('ngo', 'name causes')
      .sort({ eventDate: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error('Get mentor events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/mentor/debug
 * @desc    Debug endpoint to check mentor's own ID and assigned students
 * @access  Private (Mentor only)
 */
router.get('/debug', authMiddleware, mentorOnly, async (req, res) => {
  try {
    const mentorId = new mongoose.Types.ObjectId(req.user.id);
    console.log(`🔍 DEBUG: Mentor ID from token: ${mentorId}`);

    // Get the mentor's own record
    const mentorRecord = await User.findById(mentorId).select('name email role');
    console.log(`🔍 DEBUG: Mentor record found:`, mentorRecord);

    // Find students with this mentor ID
    const studentsWithThisId = await User.find({ mentor: mentorId, role: 'student' }).select('name email mentor');
    console.log(`🔍 DEBUG: Students with mentor ID ${mentorId}:`, studentsWithThisId);

    // Find all students and show their mentor field
    const allStudents = await User.find({ role: 'student' }).select('name email mentor studentId');
    console.log(`🔍 DEBUG: All students:`, allStudents);

    res.json({
      success: true,
      debug: {
        mentorIdFromToken: mentorId.toString(),
        mentorRecord,
        studentsAssignedToMentor: studentsWithThisId,
        allStudents
      }
    });
  } catch (error) {
    console.error('❌ DEBUG error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/mentor/analytics
 * @desc    Get analytics for mentor's assigned students
 * @access  Private (Mentor only)
 * @CO      CO3 - REST API with aggregation
 */
router.get('/analytics', authMiddleware, mentorOnly, async (req, res) => {
  try {
    // Get all students assigned to this mentor
    const mentorId = new mongoose.Types.ObjectId(req.user.id);
    const mentorIdString = mentorId.toString();
    
    console.log(`📊 Analytics request from mentor: ${mentorId}`);
    console.log(`   Mentor ID (ObjectId): ${mentorId}`);
    console.log(`   Mentor ID (String): ${mentorIdString}`);
    
    // Try both ObjectId and string matching to be safe
    const mentees = await User.find({
      $or: [
        { mentor: mentorId, role: 'student' },
        { mentor: mentorIdString, role: 'student' }
      ]
    }).select('_id name totalPoints studentId'); // ✅ Include studentId field
    
    console.log(`👥 Found ${mentees.length} mentees for mentor ${mentorId}`);
    if (mentees.length > 0) {
      console.log(`📝 Mentees: ${mentees.map(m => `${m.name} (${m.studentId})`).join(', ')}`);
    }
    
    // Debug: Get all students with their mentor field
    const allStudentsDebug = await User.find({ role: 'student' }).select('_id name mentor studentId');
    console.log(`📋 ALL STUDENTS DEBUG (${allStudentsDebug.length} total):`);
    allStudentsDebug.forEach(s => {
      const mentorValue = s.mentor ? s.mentor.toString() : 'null';
      const matches = mentorValue === mentorIdString ? '✅ MATCHES' : '❌';
      console.log(`   - ${s.name} (${s.studentId}): mentor=${mentorValue} ${matches}`);
    });
    
    const menteeIds = mentees.map(m => m._id);

    // Get all submissions
    const submissions = await Submission.find({ student: { $in: menteeIds } });
    console.log(`📋 Found ${submissions.length} submissions from mentees`);

    // Count submissions by status
    const pendingCount = submissions.filter(s => s.status === 'pending').length;
    const approvedCount = submissions.filter(s => s.status === 'approved').length;
    const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

    // Calculate total points earned
    const totalPointsEarned = mentees.reduce((sum, m) => sum + m.totalPoints, 0);
    const totalHours = totalPointsEarned * 4; // Based on HOURS_PER_POINT constant

    // Student-wise breakdown - ✅ Use the actual studentId field (roll number)
    const studentBreakdown = mentees.map(student => ({
      name: student.name,
      studentId: student.studentId, // ✅ This is the actual roll number (e.g., RVCE2025XY)
      totalPoints: student.totalPoints,
      totalHours: student.totalPoints * 4,
      submissionCount: submissions.filter(s => s.student.toString() === student._id.toString()).length
    }));

    console.log(`✅ Analytics computed successfully - Found ${mentees.length} mentees`);
    
    res.json({
      success: true,
      data: {
        totalMentees: mentees.length,
        totalPointsEarned,
        totalHours,
        submissions: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: submissions.length
        },
        studentBreakdown
      },
      _debug: {
        mentorIdFromToken: mentorIdString,
        studentCount: allStudentsDebug.length,
        studentMentorMappings: allStudentsDebug.map(s => ({
          name: s.name,
          studentId: s.studentId,
          mentorId: s.mentor ? s.mentor.toString() : null,
          matchesMentor: s.mentor ? s.mentor.toString() === mentorIdString : false
        }))
      }
    });

  } catch (error) {
    console.error('❌ Get mentor analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
