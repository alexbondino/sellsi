// Test script to verify RPC function exists and works
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clbngnjetipglkikondm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsYm5nbmpldGlwZ2xraWtvbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzczNzEsImV4cCI6MjA2ODI1MzM3MX0.4EpHtBMJ_Lh8O77sAPat-oVvOqYv89qm5wg5KMmfaFc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPCFunction() {
  console.log('Testing RPC function create_notification...');
  
  // Test with minimal required parameters
  const result = await supabase.rpc('create_notification', {
    p_user_id: 'ae9be238-f13e-4edd-ac30-ec5854dae54f',
    p_type: 'test',
    p_title: 'Test notification'
  });
  
  console.log('RPC Result:', result);
  
  if (result.error) {
    console.error('RPC Error Details:', result.error);
    console.error('Error message:', result.error.message);
    console.error('Error code:', result.error.code);
    console.error('Error details:', result.error.details);
    console.error('Error hint:', result.error.hint);
  } else {
    console.log('RPC Success! Data:', result.data);
  }
}

testRPCFunction().catch(console.error);
