// ===== backend/scripts/verifyDataIntegrity.js =====
/**
 * Data Integrity Verification Script
 * Checks:
 * 1. Events are properly linked to mentors
 * 2. Students are assigned to mentors correctly
 * 3. Event visibility rules are consistent
 * 
 * Usage: node verifyDataIntegrity.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
require('dotenv').config();

const verifyDataIntegrity = async () => {
  try {
    console.log('\n🔍 Starting Data Integrity Verification...\n');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ===== CHECK 1: Verify Student-Mentor Assignments =====
    console.log('=' .repeat(60));
    console.log('CHECK 1: Student-Mentor Assignments');
    console.log('=' .repeat(60));
    
    const students = await User.find({ role: 'student' })
      .populate('mentor', 'name email')
      .sort('name');
    
    console.log(`\nTotal Students: ${students.length}\n`);
    
    const unassignedStudents = [];
    const assignedStudents = [];
    
    for (const student of students) {
      if (student.mentor) {
        assignedStudents.push(student);
        console.log(`✅ ${student.name} (${student.studentId}) → ${student.mentor.name}`);
      } else {
        unassignedStudents.push(student);
        console.log(`⚠️  ${student.name} (${student.studentId}) → NO MENTOR`);
      }
    }
    
    console.log(`\n📊 Summary: ${assignedStudents.length} assigned, ${unassignedStudents.length} unassigned`);

    // ===== CHECK 2: Verify Mentor-Student Relationships =====
    console.log('\n' + '='.repeat(60));
    console.log('CHECK 2: Mentor-Student Relationships');
    console.log('='.repeat(60));
    
    const mentors = await User.find({ role: 'mentor' }).sort('name');
    
    console.log(`\nTotal Mentors: ${mentors.length}\n`);
    
    for (const mentor of mentors) {
      const menteeCount = await User.countDocuments({ mentor: mentor._id, role: 'student' });
      const hasStudents = menteeCount > 0;
      console.log(`${hasStudents ? '✅' : '⚠️ '} ${mentor.name} (${mentor.email}): ${menteeCount} student(s)`);
      
      // List students
      if (menteeCount > 0) {
        const mentees = await User.find({ mentor: mentor._id, role: 'student' }).select('name studentId');
        mentees.forEach(m => console.log(`    - ${m.name} (${m.studentId})`));
      }
    }

    // ===== CHECK 3: Verify Event Creation and Scoping =====
    console.log('\n' + '='.repeat(60));
    console.log('CHECK 3: Event Creation and Scoping');
    console.log('='.repeat(60));
    
    const events = await Event.find()
      .populate('createdBy', 'name email role')
      .populate('ngo', 'name')
      .sort('createdAt');
    
    console.log(`\nTotal Events: ${events.length}\n`);
    
    let adminEvents = 0;
    let mentorEvents = 0;
    let eventIssues = [];
    
    for (const event of events) {
      if (event.createdByRole === 'admin') {
        adminEvents++;
        console.log(`✅ EVENT: "${event.title}"`);
        console.log(`    Creator: ${event.createdBy.name} (ADMIN)`);
        console.log(`    NGO: ${event.ngo.name}`);
        console.log(`    Scope: EVERYONE`);
      } else if (event.createdByRole === 'mentor') {
        mentorEvents++;
        console.log(`✅ EVENT: "${event.title}"`);
        console.log(`    Creator: ${event.createdBy.name} (MENTOR)`);
        console.log(`    NGO: ${event.ngo.name}`);
        
        if (event.createdForMentor) {
          const mentor = await User.findById(event.createdForMentor).select('name');
          console.log(`    Scope: ${mentor?.name || 'Unknown Mentor'}'s students`);
          
          // Verify createdBy matches createdForMentor
          if (event.createdBy._id.toString() !== event.createdForMentor.toString()) {
            eventIssues.push({
              eventId: event._id,
              title: event.title,
              issue: 'createdBy does not match createdForMentor'
            });
            console.log(`    ⚠️  ISSUE: createdBy !== createdForMentor`);
          }
        } else {
          console.log(`    Scope: NO MENTOR SET (ERROR!)`);
          eventIssues.push({
            eventId: event._id,
            title: event.title,
            issue: 'createdForMentor is not set'
          });
          console.log(`    ⚠️  ISSUE: createdForMentor not set`);
        }
      } else {
        console.log(`❌ EVENT: "${event.title}"`);
        console.log(`    Creator: ${event.createdBy?.name || 'Unknown'}`);
        console.log(`    ⚠️  ISSUE: Unknown createdByRole = ${event.createdByRole}`);
        eventIssues.push({
          eventId: event._id,
          title: event.title,
          issue: `Unknown createdByRole = ${event.createdByRole}`
        });
      }
      console.log('');
    }
    
    console.log(`📊 Summary: ${adminEvents} admin events, ${mentorEvents} mentor events`);

    // ===== CHECK 4: Event Visibility Simulation =====
    console.log('\n' + '='.repeat(60));
    console.log('CHECK 4: Event Visibility Simulation');
    console.log('='.repeat(60));
    
    console.log('\nSimulating event visibility for each user:\n');
    
    // For each unassigned student, verify they shouldn't see mentor events
    if (unassignedStudents.length > 0) {
      const unassignedStudent = unassignedStudents[0];
      console.log(`📌 Unassigned Student: ${unassignedStudent.name}`);
      
      const mentorEventCount = await Event.countDocuments({ createdByRole: 'mentor' });
      const adminEventCount = await Event.countDocuments({ createdByRole: 'admin' });
      
      console.log(`    Can see ${adminEventCount} admin event(s)`);
      console.log(`    Should NOT see ${mentorEventCount} mentor event(s)`);
      console.log(`    Expected visibility: ${adminEventCount} events\n`);
    }
    
    // For each assigned student, verify they see their mentor's events + admin events
    if (assignedStudents.length > 0) {
      const student = assignedStudents[0];
      const adminEventCount = await Event.countDocuments({ createdByRole: 'admin' });
      const mentorEventCount = await Event.countDocuments({ 
        createdForMentor: student.mentor,
        createdByRole: 'mentor'
      });
      
      console.log(`📌 Assigned Student: ${student.name} (Mentor: ${student.mentor?.name})`);
      console.log(`    Can see ${adminEventCount} admin event(s)`);
      console.log(`    Can see ${mentorEventCount} event(s) from their mentor`);
      console.log(`    Expected visibility: ${adminEventCount + mentorEventCount} events\n`);
    }

    // ===== SUMMARY =====
    console.log('='.repeat(60));
    console.log('INTEGRITY SUMMARY');
    console.log('='.repeat(60));
    
    if (eventIssues.length === 0) {
      console.log('\n✅ All data integrity checks passed!');
    } else {
      console.log(`\n⚠️  Found ${eventIssues.length} integrity issue(s):\n`);
      eventIssues.forEach((issue, i) => {
        console.log(`${i + 1}. Event: "${issue.title}"`);
        console.log(`   Problem: ${issue.issue}`);
        console.log(`   EventId: ${issue.eventId}\n`);
      });
    }

    console.log(`\n📊 STATS:`);
    console.log(`   Total Users: ${students.length + mentors.length}`);
    console.log(`   Total Students: ${students.length}`);
    console.log(`   Total Mentors: ${mentors.length}`);
    console.log(`   Assigned Students: ${assignedStudents.length}`);
    console.log(`   Unassigned Students: ${unassignedStudents.length}`);
    console.log(`   Total Events: ${events.length}`);
    console.log(`   Admin Events: ${adminEvents}`);
    console.log(`   Mentor Events: ${mentorEvents}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed\n');
    process.exit(0);
  }
};

verifyDataIntegrity();
