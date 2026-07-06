const { execSync } = require('child_process');
const https = require('https');

console.log('=============================================');
console.log('         SMARANAI AUTOMATED SANITY TEST      ');
console.log('=============================================');

// Test 1: Compile User App
console.log('\n[1/3] Running Compilation Test for User App...');
try {
  execSync('npm run build', { cwd: './User', stdio: 'inherit' });
  console.log('✅ User App compiled successfully.');
} catch (error) {
  console.error('❌ User App compilation failed!');
  process.exit(1);
}

// Test 2: Compile Admin App
console.log('\n[2/3] Running Compilation Test for Admin App...');
try {
  execSync('npm run build', { cwd: './Admin', stdio: 'inherit' });
  console.log('✅ Admin App compiled successfully.');
} catch (error) {
  console.error('❌ Admin App compilation failed!');
  process.exit(1);
}

// Test 3: Backend API Health Check (Supabase Edge Function)
console.log('\n[3/3] Checking Backend API Health (Deno Edge Function)...');
const edgeUrl = 'https://uqkqewydjbqqiuezxnqk.supabase.co/functions/v1/w_edge';

const data = JSON.stringify({ action: 'health_check' });

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(edgeUrl, options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      if (res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401) {
        console.log('✅ Supabase Deno Edge API is online and responding.');
        console.log('=============================================');
        console.log('🎉 ALL SANITY CHECKS PASSED SUCCESSFULLY!');
        console.log('=============================================');
        process.exit(0);
      } else {
        console.error(`❌ Unexpected backend response status: ${res.statusCode}`);
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Failed to parse backend JSON response:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Backend connection failed:', error.message);
  process.exit(1);
});

req.write(data);
req.end();
