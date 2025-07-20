#!/usr/bin/env node

/**
 * Quiz Battle Setup Verification Script
 * Checks if all required environment variables and dependencies are configured
 */

const fs = require('fs');
const path = require('path');

console.log('🎮 Quiz Battle Setup Verification\n');

// Check if .env file exists
const envPath = path.join(__dirname, '../packages/database/.env');
const envExists = fs.existsSync(envPath);

console.log('📁 Environment Configuration:');
console.log(`   .env file: ${envExists ? '✅ Found' : '❌ Missing'}`);

if (envExists) {
  // Read and check environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  console.log('\n🔐 Required Environment Variables:');
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(`${varName}=`) && 
                  !envContent.includes(`${varName}="[`) && 
                  !envContent.includes(`${varName}=""`) &&
                  !envContent.includes(`${varName}=''`);
    console.log(`   ${varName}: ${hasVar ? '✅ Set' : '❌ Missing/Empty'}`);
  });
} else {
  console.log('\n❗ Please create packages/database/.env file');
  console.log('   Copy from packages/database/.env.example and fill in your Supabase credentials');
}

// Check if database-setup.sql exists
const sqlPath = path.join(__dirname, '../database-setup.sql');
const sqlExists = fs.existsSync(sqlPath);

console.log('\n📊 Database Setup:');
console.log(`   SQL setup file: ${sqlExists ? '✅ Found' : '❌ Missing'}`);

if (sqlExists) {
  console.log('   Next: Run this script in your Supabase SQL Editor');
} else {
  console.log('   ❗ database-setup.sql file is missing');
}

// Check node_modules
const nodeModulesExists = fs.existsSync(path.join(__dirname, '../node_modules'));
console.log(`\n📦 Dependencies: ${nodeModulesExists ? '✅ Installed' : '❌ Run npm install'}`);

// Summary
console.log('\n🚀 Setup Status:');
if (envExists && nodeModulesExists && sqlExists) {
  console.log('✅ Ready to launch! Run: npm run dev');
} else {
  console.log('❌ Setup incomplete. Follow the README.md setup guide.');
}

console.log('\n📖 Full setup guide: https://github.com/your-username/quiz-v3#quick-start');