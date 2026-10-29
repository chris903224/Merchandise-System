// impersonate.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const cleanEnv = (val) => {
  if (!val) return '';
  return val.replace(/['"]/g, '').replace(/\\r/g, '').replace(/\\n/g, '').trim();
};

const supabaseUrl = cleanEnv(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
const serviceRoleKey = cleanEnv(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing URL or SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// 2. Kunin ang Student ID mula sa terminal command
const studentIdNumber = process.argv[2];

if (!studentIdNumber) {
  console.error('❌ Please provide a Student ID. Example: node impersonate.js ORG-001');
  process.exit(1);
}

async function generateImpersonationLink() {
  console.log(`🔄 Searching for user with ID: ${studentIdNumber}...`);

  // 3. Hanapin ang user sa profiles table gamit ang tamang column (student_id)
  const { data: student, error: studentError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('student_id', studentIdNumber)  // ✅ student_id na!
    .single();

  if (studentError || !student) {
    console.error(`❌ User not found or error: ${studentError?.message}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${student.name} (${student.email})`);
  console.log(`   Role: ${student.role}`);

  // 4. Gumawa ng Magic Link para sa user
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: student.email,
  });

  if (linkError) {
    console.error(`❌ Failed to generate magic link: ${linkError.message}`);
    process.exit(1);
  }

  // 5. I-save ang magic link sa isang text file
  const link = linkData.properties.action_link;
  fs.writeFileSync('impersonation-link.txt', link);
  
  console.log('\n=========================================');
  console.log('🎉 SUCCESS! MAGIC LINK GENERATED!');
  console.log('=========================================');
  console.log('📋 Link:');
  console.log(link);
  console.log('\n💡 Paano gamitin:');
  console.log('1. Buksan ang browser mo (Chrome/Edge).');
  console.log('2. I-paste ang link sa address bar at pindutin ang Enter.');
  console.log('3. Mag-login ka na bilang estudyante at makikita mo ang totoong data niya.');
  console.log('=========================================\n');
  
  process.exit(0);
}

generateImpersonationLink();