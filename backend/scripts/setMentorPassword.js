/**
 * Set or Update Mentor Password with Proper Hashing
 * 
 * Usage:
 * node scripts/setMentorPassword.js <email> <newPassword>
 * 
 * Example:
 * node scripts/setMentorPassword.js mentor@college.edu securePassword123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function setMentorPassword(email, password) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected');

    // Validate input
    if (!email || !password) {
      console.error('❌ Error: Email and password are required');
      console.log('Usage: node setMentorPassword.js <email> <password>');
      process.exit(1);
    }

    // Find the mentor
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ Error: No user found with email: ${email}`);
      process.exit(1);
    }

    if (user.role !== 'mentor') {
      console.error(`❌ Error: User ${email} is a ${user.role}, not a mentor`);
      process.exit(1);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the password directly to avoid the pre-save hook doubling the hash
    await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true }
    );

    console.log(`✅ Password updated successfully for mentor: ${email}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 New password: ${password}`);
    console.log('\n👉 Try logging in now!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('❌ Missing arguments');
  console.log('Usage: node scripts/setMentorPassword.js <email> <password>');
  process.exit(1);
}

setMentorPassword(args[0], args[1]);
