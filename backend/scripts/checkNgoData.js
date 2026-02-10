// ===== backend/scripts/checkNgoData.js =====
/**
 * Check NGO Data in Database
 * Usage: node checkNgoData.js
 */

const mongoose = require('mongoose');
const Ngo = require('../models/Ngo');
require('dotenv').config();

const checkNgoData = async () => {
  try {
    console.log('🔍 Checking NGO Data in Database...\n');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check total NGOs
    const totalCount = await Ngo.countDocuments();
    console.log(`📊 Total NGOs in database: ${totalCount}`);

    // Check verified NGOs
    const verifiedCount = await Ngo.countDocuments({ isVerified: true });
    console.log(`✅ Verified NGOs: ${verifiedCount}`);

    // Check unverified NGOs
    const unverifiedCount = await Ngo.countDocuments({ isVerified: false });
    console.log(`⚠️  Unverified NGOs: ${unverifiedCount}`);

    // Show sample verified NGO
    if (verifiedCount > 0) {
      console.log('\n📋 Sample Verified NGO:');
      const sample = await Ngo.findOne({ isVerified: true });
      console.log(JSON.stringify(sample, null, 2));
    }

    // Show sample unverified NGO (if exists)
    if (unverifiedCount > 0) {
      console.log('\n📋 Sample Unverified NGO:');
      const sample = await Ngo.findOne({ isVerified: false });
      console.log(JSON.stringify(sample, null, 2));
    }

    // List all NGO names (verified only)
    if (verifiedCount > 0) {
      console.log('\n📋 All Verified NGO Names:');
      const allNgos = await Ngo.find({ isVerified: true })
        .select('name isVerified')
        .sort({ name: 1 });
      
      allNgos.forEach((ngo, index) => {
        console.log(`  ${index + 1}. ${ngo.name}`);
      });
    }

    // Check for any NGOs with empty names
    const emptyNames = await Ngo.countDocuments({ name: { $in: ['', null] } });
    if (emptyNames > 0) {
      console.log(`\n⚠️  Found ${emptyNames} NGOs with empty names`);
    }

    console.log('\n✅ Check completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

checkNgoData();
