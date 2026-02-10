/**
 * Event Routes
 * CO3: CRUD operations for volunteer events
 */

const express = require('express');
const router = express.Router(); // <--- This MUST stay at the top
const Event = require('../models/Event');
const Ngo = require('../models/Ngo');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/**
 * Helper Function: Auto-update event status based on date
 * Defined here so it can be used in the routes below
 */
async function updateEventStatuses(events) {
  const now = new Date();
  
  for (const event of events) {
    const eventDate = new Date(event.eventDate);
    const eventEndDate = event.eventEndDate ? new Date(event.eventEndDate) : eventDate;
    
    let needsSave = false;
    
    // Auto-update status based on dates
    if (now > eventEndDate && event.status !== 'completed' && event.status !== 'cancelled') {
      event.status = 'completed';
      needsSave = true;
    } else if (now >= eventDate && now <= eventEndDate && event.status === 'upcoming') {
      event.status = 'ongoing';
      needsSave = true;
    }

    if (needsSave) {
      await event.save();
    }
  }
  
  return events;
}

/**
 * @route   GET /api/events
 * @desc    Get events filtered by user role and mentor assignment
 * @access  Private
 * @CO      CO3 - REST API
 * 
 * Filtering Logic:
 * - Admin: See all events
 * - Mentor: See events they created + all admin-created events
 * - Student: See events created by their assigned mentor + all admin-created events
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, activityType, ngo } = req.query;
    const userId = req.user?.id || req.user?._id;
    const userRole = req.user?.role;

    console.log(`📨 GET /events - User: ${req.user?.email}, Role: ${userRole}, UserId: ${userId}`);

    const query = {};
    if (status) query.status = status;
    if (activityType) query.activityType = activityType;
    if (ngo) query.ngo = ngo;

    // Build role-based filter
    let roleFilter = {};
    
    if (userRole === 'admin') {
      // Admins see all events
      console.log('👤 Admin user - showing all events');
      roleFilter = {};
    } else if (userRole === 'mentor') {
      // Mentors see: events they created + events from admin
      console.log('👤 Mentor user - filtering events');
      roleFilter = {
        $or: [
          { createdBy: userId },           // Events they created
          { createdByRole: 'admin' }       // Events created by admin
        ]
      };
    } else if (userRole === 'student') {
      // Students see: events from their assigned mentor + events from admin
      console.log('👤 Student user - filtering by mentor');
      
      // First, find the student and their mentor
      const User = require('../models/User');
      const student = await User.findById(userId).select('mentor');
      
      if (!student) {
        console.log('⚠️  Student not found:', userId);
        return res.status(404).json({
          success: false,
          message: 'Student record not found'
        });
      }
      
      const mentorId = student.mentor;
      console.log(`📌 Student's mentor: ${mentorId}`);
      
      roleFilter = {
        $or: [
          { createdBy: mentorId, createdByRole: 'mentor' },  // Events from their mentor
          { createdByRole: 'admin' }                          // Events from admin
        ]
      };
    } else {
      console.log('⚠️  Unknown role:', userRole);
      roleFilter = { createdByRole: 'admin' }; // Default: only show admin events
    }

    // Combine filters
    const finalQuery = { ...query, ...roleFilter };
    console.log('🔍 Query:', JSON.stringify(finalQuery));

    let events = await Event.find(finalQuery)
      .populate('ngo', 'name causes officialWebsite')
      .populate('createdBy', 'name email')
      .sort({ eventDate: 1 });

    console.log(`✅ Found ${events.length} events`);

    // Run the auto-update logic
    events = await updateEventStatuses(events);

    res.json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error('❌ Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/events/ngos/list
 * @desc    Get all NGOs for dropdown
 */
router.get('/ngos/list', authMiddleware, adminOnly, async (req, res) => {
  try {
    const ngos = await Ngo.find({ isVerified: true })
      .select('name causes aicteActivities officialWebsite')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: ngos.length,
      data: ngos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/events/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('ngo')
      .populate('createdBy', 'name email');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/events
 */
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, ngo, activityType, pointsAwarded, eventDate, eventEndDate, location, maxParticipants } = req.body;

    if (!title || !description || !ngo || !activityType || !pointsAwarded || !eventDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const event = await Event.create({
      title, description, ngo, activityType, pointsAwarded,
      eventDate, eventEndDate, location, maxParticipants,
      createdBy: req.user.id
      // ✅ hoursEquivalent is auto-calculated by pre-save hook (pointsAwarded * HOURS_PER_POINT)
    });

    console.log(`Event created: "${event.title}" | Points: ${event.pointsAwarded} | Hours: ${event.hoursEquivalent}`);

    await event.populate('ngo', 'name causes');

    res.status(201).json({ success: true, message: 'Event created successfully', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/events/:id
 */
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const allowedUpdates = ['title', 'description', 'activityType', 'pointsAwarded', 'eventDate', 'eventEndDate', 'location', 'maxParticipants', 'status'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    await event.save();
    await event.populate('ngo', 'name causes');

    res.json({ success: true, message: 'Event updated successfully', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/events/:id
 */
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;