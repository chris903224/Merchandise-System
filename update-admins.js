// update-admins.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

// 2. ULTIMATE CLEANUP FUNCTION
const cleanEnv = (val) => {
  if (!val) return '';
  // Tanggalin ang quotes, spaces, at carriage returns (\r)
  return val.replace(/['"]/g, '').replace(/\\r/g, '').replace(/\\n/g, '').trim();
};

const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const rawKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseUrl = cleanEnv(rawUrl);
const serviceRoleKey = cleanEnv(rawKey);

// 3. DEBUGGING (Para makita natin ang exact string)
console.log('--- 🔍 DEBUG INFO ---');
console.log('📡 Raw URL:', JSON.stringify(rawUrl));
console.log('📡 Clean URL:', JSON.stringify(supabaseUrl));
console.log('🔑 Raw Key Length:', rawKey ? rawKey.length : 0);
console.log('🔑 Clean Key Length:', serviceRoleKey.length);
console.log('---------------------');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing URL or SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// 🚨 I-check kung may "http" sa simula
if (!supabaseUrl.startsWith('http')) {
  console.error('❌ Error: The URL does not start with http:// or https://');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const ADMINS = [
  { email: process.env.ADMIN_1_EMAIL, password: process.env.ADMIN_1_PASS },
  { email: process.env.ADMIN_2_EMAIL, password: process.env.ADMIN_2_PASS },
  { email: process.env.ADMIN_3_EMAIL, password: process.env.ADMIN_3_PASS },
  { email: process.env.ADMIN_4_EMAIL, password: process.env.ADMIN_4_PASS },
  { email: process.env.ADMIN_5_EMAIL, password: process.env.ADMIN_5_PASS },
];

async function updateAdmins() {
  console.log('🔄 Fetching existing users...');
  
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  for (const admin of ADMINS) {
    if (!admin.email || !admin.password) {
      console.warn(`⚠️ Skipping missing email/password config`);
      continue;
    }

    const user = users.find(u => u.email === admin.email);

    if (!user) {
      console.log(`⚠️ User not found: ${admin.email}. Creating new...`);
      
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
      });

      if (createError) {
        console.error(`❌ Failed to create ${admin.email}:`, createError.message);
      } else {
        console.log(`✅ Created ${admin.email}`);
      }
      continue;
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: admin.password,
      email_confirm: true,
    });

    if (updateError) {
      console.error(`❌ Failed to update ${admin.email}:`, updateError.message);
    } else {
      console.log(`✅ Password updated for ${admin.email}`);
    }
  }

  console.log('\n🎉 Done! All authorized admins have been updated.');
  process.exit(0);
}

updateAdmins();