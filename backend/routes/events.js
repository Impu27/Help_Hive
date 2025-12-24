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
 * @desc    Get all events (with auto-status update)
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, activityType, ngo } = req.query;

    const query = {};
    if (status) query.status = status;
    if (activityType) query.activityType = activityType;
    if (ngo) query.ngo = ngo;

    let events = await Event.find(query)
      .populate('ngo', 'name causes officialWebsite')
      .populate('createdBy', 'name email')
      .sort({ eventDate: 1 });

    // Run the auto-update logic
    events = await updateEventStatuses(events);

    res.json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
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
    });

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