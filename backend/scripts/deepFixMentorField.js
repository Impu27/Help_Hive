/**
 * Deep Inspection and Fix for Mentor Field Corruption
 * 
 * This script directly inspects and fixes the mentor field at the MongoDB level.
 * 
 * Usage:
 * node scripts/deepFixMentorField.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function deepFix() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected\n');

    // Get the raw collection (bypasses Mongoose schema)
    const collection = mongoose.connection.collection('users');
    
    // Find all students
    const students = await collection.find({ role: 'student' }).toArray();
    console.log(`📋 Found ${students.length} students in database\n`);

    let fixedCount = 0;

    for (const student of students) {
      console.log(`👤 Student: ${student.name} (${student._id})`);
      console.log(`   Current mentor field type: ${typeof student.mentor}`);
      console.log(`   Current mentor field: ${JSON.stringify(student.mentor, null, 2)}`);

      // Check various corruption patterns
      if (student.mentor) {
        let mentorId = null;

        // Pattern 1: mentor is an object with $oid
        if (student.mentor && typeof student.mentor === 'object' && student.mentor.$oid) {
          mentorId = student.mentor.$oid;
          console.log(`   🔍 Pattern 1 detected: Object with $oid`);
        }
        // Pattern 2: mentor is already an ObjectId
        else if (student.mentor instanceof mongoose.Types.ObjectId) {
          console.log(`   ✅ Already correct ObjectId, skipping`);
          continue;
        }
        // Pattern 3: mentor is a string that looks like an ObjectId
        else if (typeof student.mentor === 'string' && student.mentor.length === 24) {
          mentorId = student.mentor;
          console.log(`   🔍 Pattern 3 detected: String ObjectId`);
        }

        if (mentorId) {
          // Convert mentorId string to ObjectId
          const objectId = new mongoose.Types.ObjectId(mentorId);
          
          // Update the student's mentor field to proper ObjectId
          await collection.updateOne(
            { _id: student._id },
            { $set: { mentor: objectId } }
          );

          console.log(`   ✅ FIXED! New mentor ID: ${objectId}`);
          fixedCount++;
        }
      } else {
        console.log(`   ⚠️  mentor field is null/undefined`);
      }
      
      console.log();
    }

    if (fixedCount > 0) {
      console.log(`\n✅ FIXED ${fixedCount} student mentor fields!\n`);
      
      // Verify the fix
      console.log('📝 Verification:');
      const mentor = await User.findOne({ email: 'faculty1@gmail.com' });
      if (mentor) {
        const assignedStudents = await User.find({ mentor: mentor._id, role: 'student' });
        console.log(`   Mentor: ${mentor.name} (${mentor._id})`);
        console.log(`   Assigned students: ${assignedStudents.length}`);
        assignedStudents.forEach(s => {
          console.log(`   - ${s.name} (${s.email}) - ${s.totalPoints} points`);
        });
      }
    } else {
      console.log('✅ No corrupted mentor fields found or all already fixed.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

console.log('🔧 DEEP FIX FOR MENTOR FIELD CORRUPTION\n');
deepFix();
