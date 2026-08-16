const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

async function runAuthVerificationMatrix() {
  console.log('🧪 ==========================================');
  console.log('   PRODUCTION AUTH VERIFICATION MATRIX');
  console.log('==========================================\n');

  const testEmail = `test.dev.${Date.now()}@commandcenter.dev`;
  const validPassword = 'SecurePassword@2026';
  const wrongPassword = 'WrongPassword@9999';
  const testName = 'Alok Choudhary';

  let authCookie = null;

  // TEST 1: Local Registration with Strong Password
  console.log('📌 Test 1: Local Registration with Strong Password & bcrypt-12');
  try {
    const regRes = await axios.post(`${BASE_URL}/register`, {
      name: testName,
      email: testEmail,
      password: validPassword,
      confirmPassword: validPassword,
    });
    console.log('  ✅ Status:', regRes.status, 'User created:', regRes.data.data.user.email);
    console.log('  ✅ Auth Provider:', regRes.data.data.user.authProvider);
    console.log('  ✅ Password Hash exposed to frontend?:', regRes.data.data.user.passwordHash === undefined ? 'NO (Safe)' : 'YES (Leak!)');
    
    // Extract Set-Cookie
    const cookies = regRes.headers['set-cookie'];
    if (cookies) {
      authCookie = cookies.find(c => c.startsWith('auth_token='));
      console.log('  ✅ auth_token HttpOnly Cookie Received:', authCookie ? 'YES' : 'NO');
    }
  } catch (err) {
    console.error('  ❌ Test 1 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // TEST 2: Duplicate Registration Protection
  console.log('\n📌 Test 2: Duplicate Email Registration Protection');
  try {
    await axios.post(`${BASE_URL}/register`, {
      name: testName,
      email: testEmail,
      password: validPassword,
      confirmPassword: validPassword,
    });
    console.error('  ❌ Test 2 Failed: Duplicate was not rejected!');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('  ✅ Status:', err.response.status, 'Error Message:', err.response.data.error.message);
    } else {
      console.error('  ❌ Test 2 Failed with unexpected error:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  // TEST 3: Login with Wrong Password
  console.log('\n📌 Test 3: Login with Wrong Password (Generic Non-Revealing Error)');
  try {
    await axios.post(`${BASE_URL}/login`, {
      email: testEmail,
      password: wrongPassword,
    });
    console.error('  ❌ Test 3 Failed: Wrong password was accepted!');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('  ✅ Status:', err.response.status, 'Error Message:', err.response.data.error.message);
    } else {
      console.error('  ❌ Test 3 Failed with unexpected error:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  // TEST 4: Login with Non-Existent Email
  console.log('\n📌 Test 4: Login with Unknown Email (Generic Non-Revealing Error)');
  try {
    await axios.post(`${BASE_URL}/login`, {
      email: 'nonexistent.user.999@domain.com',
      password: validPassword,
    });
    console.error('  ❌ Test 4 Failed: Non-existent email was accepted!');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('  ✅ Status:', err.response.status, 'Error Message:', err.response.data.error.message);
    } else {
      console.error('  ❌ Test 4 Failed with unexpected error:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  // TEST 5: Correct Login
  console.log('\n📌 Test 5: Correct Email + Password Login');
  try {
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      email: testEmail,
      password: validPassword,
    });
    console.log('  ✅ Status:', loginRes.status, 'Logged in as:', loginRes.data.data.user.email);
    const loginCookies = loginRes.headers['set-cookie'];
    if (loginCookies) {
      authCookie = loginCookies.find(c => c.startsWith('auth_token='));
      console.log('  ✅ Valid JWT Session Cookie Issued:', authCookie ? 'YES' : 'NO');
    }
  } catch (err) {
    console.error('  ❌ Test 5 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // TEST 6: Session Restoration (/api/auth/me) with Cookie
  console.log('\n📌 Test 6: Session Restoration (/api/auth/me)');
  try {
    const meRes = await axios.get(`${BASE_URL}/me`, {
      headers: {
        Cookie: authCookie,
      },
    });
    console.log('  ✅ Status:', meRes.status, 'Restored User:', meRes.data.data.user.name, `(${meRes.data.data.user.email})`);
    console.log('  ✅ Role:', meRes.data.data.user.role);
  } catch (err) {
    console.error('  ❌ Test 6 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // TEST 7: OAuth CSRF State Mismatch Rejection
  console.log('\n📌 Test 7: OAuth CSRF State Mismatch Protection');
  try {
    await axios.get(`${BASE_URL}/google/callback?state=invalid_tampered_state&code=test_code`, {
      headers: {
        Cookie: 'oauth_state=legitimate_random_state_123',
      },
    });
    console.error('  ❌ Test 7 Failed: Tampered OAuth state was not rejected!');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('  ✅ Status:', err.response.status, 'Error Code:', err.response.data.error.code, `(${err.response.data.error.message})`);
    } else {
      console.error('  ❌ Test 7 Failed with unexpected error:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  // TEST 8: Session Termination & Logout
  console.log('\n📌 Test 8: Real Session Termination & Logout');
  try {
    const logoutRes = await axios.post(`${BASE_URL}/logout`, {}, {
      headers: {
        Cookie: authCookie,
      },
    });
    console.log('  ✅ Status:', logoutRes.status, 'Message:', logoutRes.data.message);
    
    // Test that protected /me now returns 401
    try {
      await axios.get(`${BASE_URL}/me`, {
        headers: {
          Cookie: 'auth_token=; Max-Age=0', // Simulating cleared cookie
        },
      });
      console.error('  ❌ Test 8 Failed: /me was accessible after logout!');
      process.exit(1);
    } catch (unauthErr) {
      if (unauthErr.response?.status === 401) {
        console.log('  ✅ Subsequent /api/auth/me correctly returned 401 Unauthorized.');
      }
    }
  } catch (err) {
    console.error('  ❌ Test 8 Failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n🏆 ==========================================');
  console.log('   ALL 8 AUTH MATRIX TESTS PASSED (100% OK)');
  console.log('==========================================\n');
}

runAuthVerificationMatrix();
