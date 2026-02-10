/**
 * Diagnose Mentor-Student Relationship
 * 
 * This script finds all occurrences of a mentor ID in student documents
 * to understand how the relationship is actually stored.
 * 
 * Usage:
 * node scripts/diagnoseMentorRelationship.js <mentorEmail>
 * 
 * Example:
 * node scripts/diagnoseMentorRelationship.js faculty1@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

async function diagnose(mentorEmail) {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected\n');

    // Find the mentor
    const mentor = await User.findOne({ email: mentorEmail });
    if (!mentor) {
      console.error(`❌ No mentor found: ${mentorEmail}`);
      process.exit(1);
    }

    const mentorId = mentor._id.toString();
    console.log(`🔍 SEARCHING FOR MENTOR: ${mentor.name} (${mentorId})\n`);

    // 1. Check students with mentor field set correctly
    console.log(`📝 1. STUDENTS WITH mentor FIELD SET TO THIS MENTOR:`);
    const studentsWithMentorField = await User.find({ mentor: mentor._id, role: 'student' });
    console.log(`   Found: ${studentsWithMentorField.length}`);
    if (studentsWithMentorField.length > 0) {
      studentsWithMentorField.forEach(s => {
        console.log(`   - ${s.name} (${s._id})`);
      });
    } else {
      console.log(`   ⚠️  No students with mentor field\n`);
    }

    // 2. Search raw database for mentor ID in any student document
    console.log(`\n📝 2. SEARCHING DATABASE FOR MENTOR ID IN STUDENT DOCUMENTS:`);
    const allStudents = await User.find({ role: 'student' });
    console.log(`   Total students in database: ${allStudents.length}\n`);
    
    let found = 0;
    allStudents.forEach(student => {
      // Check all fields for mentor ID
      const studentJson = JSON.stringify(student);
      if (studentJson.includes(mentorId)) {
        found++;
        console.log(`   ✓ ${student.name} (${student._id})`);
        console.log(`     - mentor field: ${student.mentor}`);
        console.log(`     - mentor field type: ${student.mentor ? typeof student.mentor : 'null'}`);
        
        // Show the full document structure
        console.log(`     - Full doc preview:`);
        const fields = ['_id', 'name', 'email', 'mentor', 'totalPoints', 'role', 'studentId'];
        fields.forEach(field => {
          console.log(`       ${field}: ${JSON.stringify(student[field])}`);
        });
        console.log();
      }
    });
    
    if (found === 0) {
      console.log(`   ⚠️  Mentor ID NOT found in any student document\n`);
    } else {
      console.log(`   ✅ Found mentor ID in ${found} student documents\n`);
    }

    // 3. Check Events created by mentor
    console.log(`📝 3. EVENTS CREATED BY THIS MENTOR:`);
    const mentorEvents = await Event.find({ createdBy: mentor._id });
    console.log(`   Found: ${mentorEvents.length}`);
    if (mentorEvents.length > 0) {
      mentorEvents.forEach(e => {
        console.log(`   - ${e.title} (created for mentor: ${e.createdForMentor})`);
      });
    }

    // 4. Check Registrations for mentor's events
    if (mentorEvents.length > 0) {
      console.log(`\n📝 4. STUDENT REGISTRATIONS TO MENTOR'S EVENTS:`);
      const eventIds = mentorEvents.map(e => e._id);
      const registrations = await Registration.find({ event: { $in: eventIds } });
      console.log(`   Found: ${registrations.length} registrations`);
      if (registrations.length > 0) {
        const uniqueStudents = [...new Set(registrations.map(r => r.student.toString()))];
        console.log(`   Unique students: ${uniqueStudents.length}\n`);
        for (const studentId of uniqueStudents) {
          const student = await User.findById(studentId);
          console.log(`   - ${student?.name} registered for ${registrations.filter(r => r.student.toString() === studentId).length} event(s)`);
        }
      }
    }

    console.log(`\n✅ Diagnosis complete!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('❌ Missing arguments');
  console.log('Usage: node scripts/diagnoseMentorRelationship.js <mentorEmail>');
  process.exit(1);
}

diagnose(args[0]);
