import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error: err1 } = await supabase
    .from('properties')
    .update({ image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80' })
    .eq('slug', 'villa-azure');
  
  if (err1) console.error("Error villa-azure:", err1.message);
  else console.log("Updated villa-azure successfully");

  const { error: err2 } = await supabase
    .from('properties')
    .update({ image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80' })
    .eq('slug', 'dar-el-jeld');
    
  if (err2) console.error("Error dar-el-jeld:", err2.message);
  else console.log("Updated dar-el-jeld successfully");
}

run();
