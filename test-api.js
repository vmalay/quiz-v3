// Simple test to verify API is running
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET'
};

console.log('Testing API connection...');

const req = http.request(options, (res) => {
  console.log(`✅ API Health Check - Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Response:', JSON.parse(data));
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ API connection failed:', err.message);
  console.log('💡 Make sure to start the API server first: cd apps/api && npm run dev');
  process.exit(1);
});

req.end();