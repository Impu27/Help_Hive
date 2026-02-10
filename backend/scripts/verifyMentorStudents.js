/**
 * Verify Mentor-Student Assignments
 * 
 * Usage:
 * node scripts/verifyMentorStudents.js <mentorEmail>
 * 
 * Example:
 * node scripts/verifyMentorStudents.js faculty1@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function verifyMentorStudents(mentorEmail) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected\n');

    // Find the mentor
    const mentor = await User.findOne({ email: mentorEmail });
    if (!mentor) {
      console.error(`❌ Error: No user found with email: ${mentorEmail}`);
      process.exit(1);
    }

    console.log(`📋 MENTOR INFO:`);
    console.log(`  Name: ${mentor.name}`);
    console.log(`  Email: ${mentor.email}`);
    console.log(`  ID: ${mentor._id}`);
    console.log(`  Role: ${mentor.role}`);
    console.log(`  Active: ${mentor.isActive}\n`);

    if (mentor.role !== 'mentor') {
      console.error(`❌ Error: ${mentorEmail} is a ${mentor.role}, not a mentor!`);
      process.exit(1);
    }

    // Find all students assigned to this mentor
    const students = await User.find({ mentor: mentor._id, role: 'student' })
      .select('_id name email studentId totalPoints isActive');

    console.log(`👥 ASSIGNED STUDENTS (${students.length} total):`);
    
    if (students.length === 0) {
      console.log(`  ⚠️  No students assigned to this mentor!`);
      console.log(`\n  To assign students, run in MongoDB:\n`);
      console.log(`  db.users.updateMany(`);
      console.log(`    { email: { $in: ["student1@college.edu", "student2@college.edu"] } },`);
      console.log(`    { $set: { mentor: ObjectId("${mentor._id}") } }`);
      console.log(`  );`);
    } else {
      students.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.name}`);
        console.log(`     - Email: ${student.email}`);
        console.log(`     - ID: ${student._id}`);
        console.log(`     - Total Points: ${student.totalPoints}`);
        console.log(`     - Active: ${student.isActive}\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('❌ Missing arguments');
  console.log('Usage: node scripts/verifyMentorStudents.js <mentorEmail>');
  console.log('Example: node scripts/verifyMentorStudents.js faculty1@gmail.com');
  process.exit(1);
}

verifyMentorStudents(args[0]);
