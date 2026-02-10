/**
 * Fix Corrupted Mentor Field in Student Documents
 * 
 * This script fixes student documents where the mentor field contains
 * a corrupted object instead of a proper ObjectId reference.
 * 
 * Usage:
 * node scripts/fixMentorCorruption.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function fixCorruption() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected\n');

    // Find all students
    const allStudents = await User.find({ role: 'student' });
    console.log(`📋 Checking ${allStudents.length} student documents...\n`);

    let fixedCount = 0;

    for (const student of allStudents) {
      // Check if mentor field is corrupted (object with $oid instead of ObjectId)
      if (student.mentor && typeof student.mentor === 'object' && student.mentor.$oid) {
        console.log(`🔧 Fixing corrupted mentor field for student: ${student.name}`);
        console.log(`   Current mentor field: ${JSON.stringify(student.mentor)}`);

        // Extract the actual mentor ID from $oid
        const mentorId = new mongoose.Types.ObjectId(student.mentor.$oid);

        // Update the student document
        await User.updateOne(
          { _id: student._id },
          { $set: { mentor: mentorId } }
        );

        console.log(`   ✅ Fixed! New mentor field: ${mentorId}\n`);
        fixedCount++;
      }
    }

    if (fixedCount === 0) {
      console.log('✅ No corrupted mentor fields found! Database is clean.\n');
    } else {
      console.log(`\n✅ FIXED ${fixedCount} corrupted mentor field(s)!\n`);
      
      // Verify the fix
      console.log('📝 Verification:');
      const mentor = await User.findOne({ email: 'faculty1@gmail.com' });
      if (mentor) {
        const students = await User.find({ mentor: mentor._id, role: 'student' });
        console.log(`   Mentor: ${mentor.name}`);
        console.log(`   Assigned students: ${students.length}`);
        students.forEach(s => {
          console.log(`   - ${s.name} (${s.email})`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

console.log('🚨 FIXING CORRUPTED MENTOR FIELD\n');
fixCorruption();
