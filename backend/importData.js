// ===== backend/importData.js =====
/**
 * NGO Data Import Script
 * CO2: Populate MongoDB from CSV file
 * Usage: node importData.js
 */

const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Ngo = require('./models/Ngo');
require('dotenv').config();

/**
 * Import NGO data from Finalbengaluru_ngos.csv
 */
const importNGOs = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Optional: Clear existing NGO data
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      await Ngo.deleteMany({});
      console.log('🗑️  Cleared existing NGO data');
    }

    const ngos = [];
    let lineCount = 0;

    // Read and parse CSV
    console.log('📖 Reading CSV file...');
    
    fs.createReadStream('./data/Finalbengaluru_ngos.csv')
      .pipe(csv())
      .on('data', (row) => {
        lineCount++;
        
        // Map CSV columns to schema (adjust based on your CSV structure)
        ngos.push({
          name: row.name || row.Name || 'Unknown NGO',
          officialWebsite: row.official_website || row.website || '',
          contactEmail: row.contactEmail || row.email || row.Email || '',
          contactPhone: row.contactPhone || row.phone || row.Phone || '',
          address: row.address || row.Address || '',
          causes: row.causes 
            ? row.causes.split(',').map(c => c.trim()).filter(Boolean)
            : [],
          aicteActivities: row['Assigned AICTE Activities'] || row.aicteActivities
            ? (row['Assigned AICTE Activities'] || row.aicteActivities)
                .split(',').map(a => a.trim()).filter(Boolean)
            : [],
          isVerified: true
        });
      })
      .on('end', async () => {
        try {
          console.log(`📊 Parsed ${lineCount} rows from CSV`);
          console.log(`💾 Inserting ${ngos.length} NGOs into database...`);

          // Insert all NGOs (skip duplicates)
          const result = await Ngo.insertMany(ngos, { 
            ordered: false, // Continue on duplicate errors
            lean: true 
          });

          console.log(`✅ Successfully imported ${result.length} NGOs`);
          console.log('🎉 Data import completed!');
          
          // Sample output
          if (result.length > 0) {
            console.log('\nSample NGO:');
            console.log(JSON.stringify(result[0], null, 2));
          }

        } catch (insertError) {
          // Handle duplicate key errors gracefully
          if (insertError.code === 11000) {
            console.log('⚠️  Some NGOs were skipped (duplicates)');
            console.log(`✅ Import completed with warnings`);
          } else {
            throw insertError;
          }
        } finally {
          await mongoose.connection.close();
          console.log('👋 Database connection closed');
        }
      })
      .on('error', (error) => {
        console.error('❌ CSV Parsing Error:', error.message);
        mongoose.connection.close();
        process.exit(1);
      });

  } catch (error) {
    console.error('❌ Import Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Execute import
console.log('🚀 Starting NGO data import...');
console.log('Database:', process.env.MONGO_URI);
console.log('CSV File: ./data/Finalbengaluru_ngos.csv\n');

importNGOs();