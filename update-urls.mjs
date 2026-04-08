import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
  { slug: 'villa-azure', image_url: 'https://images.unsplash.com/photo-1613490908653-b8e72769cdac?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'dar-el-jeld', image_url: '/dar-el-jeld.jpg' },
  { slug: 'riva-76-perseo', image_url: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'oceans-edge', image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'villa-carthage', image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'le-golfe', image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'palais-hammamet', image_url: 'https://images.unsplash.com/photo-1551882547-ff40c0d129df?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'the-residence', image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'cap-serrat-retreat', image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop' }
];

async function run() {
  for (const item of updates) {
    const { data, error } = await supabase.from('properties').update({ image_url: item.image_url }).eq('slug', item.slug);
    console.log(`Updated ${item.slug}:`, error ? error.message : 'Success');
  }
}

run();
