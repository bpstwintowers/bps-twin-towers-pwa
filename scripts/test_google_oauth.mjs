import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://polyjkevdswpsllcgtsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHlqa2V2ZHN3cHNsbGNndHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxODY1ODgsImV4cCI6MjEwMjc2MjU4OH0.EvvSmspMfD1UcG3_-tFqp1xf_t6kvmxpa0fzQDOiOMU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGoogleOAuthRedirect() {
  console.log('--- 1. Testing supabase.auth.signInWithOAuth (Login flow) ---');
  const t0 = performance.now();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:5173/login?verify=true',
      skipBrowserRedirect: true,
    },
  });
  
  const t1 = performance.now();
  const durationMs = (t1 - t0).toFixed(2);

  if (error) {
    console.error('OAuth initiation failed:', error);
    return;
  }

  console.log(`[PASS] OAuth initiation URL generation time: ${durationMs} ms`);
  console.log('OAuth Data:', data);
  console.log('Generated Redirect URL:', data.url);

  if (data?.url) {
    console.log('\n--- 2. Measuring response & redirection time to Supabase / Google OAuth ---');
    const tFetchStart = performance.now();
    try {
      const resp = await fetch(data.url, {
        method: 'GET',
        redirect: 'manual',
      });
      const tFetchEnd = performance.now();
      console.log(`HTTP Status: ${resp.status} ${resp.statusText}`);
      const loc = resp.headers.get('location');
      console.log(`Location Header (Google Redirect): ${loc ? loc.substring(0, 120) + '...' : 'none'}`);
      console.log(`Supabase OAuth endpoint response time: ${(tFetchEnd - tFetchStart).toFixed(2)} ms`);

      if (loc) {
        console.log('\n--- 3. Testing Google Auth Endpoint Handshake time ---');
        const tGoogleStart = performance.now();
        const googleResp = await fetch(loc, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        });
        const tGoogleEnd = performance.now();
        console.log(`Google HTTP Status: ${googleResp.status} ${googleResp.statusText}`);
        console.log(`Google Auth Page load / handshake latency: ${(tGoogleEnd - tGoogleStart).toFixed(2)} ms`);
      }
    } catch (e) {
      console.log('Fetch error:', e.message);
    }
  }

  console.log('\n--- 4. Testing Registration Flow Google OAuth (with query params) ---');
  const tReg0 = performance.now();
  const { data: regData, error: regError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:5173/register?oauth_return=true',
      skipBrowserRedirect: true,
    },
  });
  const tReg1 = performance.now();
  console.log(`[PASS] Registration OAuth initiation time: ${(tReg1 - tReg0).toFixed(2)} ms`);
  console.log('Registration Redirect URL:', regData?.url);
}

testGoogleOAuthRedirect().catch(console.error);
