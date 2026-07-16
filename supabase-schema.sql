-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Tables

-- Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    price TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    gallery JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT true,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    image_url TEXT,
    "order" INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    cover_image TEXT,
    excerpt TEXT,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Team Table
CREATE TABLE IF NOT EXISTS public.team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    photo_url TEXT,
    bio TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author TEXT NOT NULL,
    role TEXT,
    quote TEXT NOT NULL,
    photo_url TEXT,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inquiries Table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    property_id UUID REFERENCES public.properties(id),
    status TEXT DEFAULT 'new',            -- new | contacted | booked | finished
    phone TEXT,
    check_in DATE,
    check_out DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Property Bookings Table (blocked/booked date ranges per property)
CREATE TABLE IF NOT EXISTS public.property_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',      -- 'manual' | 'inquiry'
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
    note TEXT,
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_range CHECK (end_date > start_date)
);


-- 2. Configure Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_bookings ENABLE ROW LEVEL SECURITY;

-- Public (anon key) may only READ published content. All writes go through
-- the admin API using the service role, which bypasses RLS. Inquiries are
-- insert-only for the public so customer PII is never readable client-side.
CREATE POLICY "public_read_published_properties" ON public.properties
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_published_services" ON public.services
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_published_blog_posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_published_testimonials" ON public.testimonials
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "public_read_team" ON public.team
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_inquiries" ON public.inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
-- Public reads booked date ranges to grey out unavailable dates (no PII)
CREATE POLICY "public_read_property_bookings" ON public.property_bookings
  FOR SELECT TO anon, authenticated USING (true);

-- Indexes matching the app's query patterns
CREATE INDEX IF NOT EXISTS idx_properties_pub_feat_order ON public.properties (published, featured, "order");
CREATE INDEX IF NOT EXISTS idx_services_pub_order        ON public.services (published, "order");
CREATE INDEX IF NOT EXISTS idx_blog_posts_pub            ON public.blog_posts (published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_pub_created  ON public.testimonials (published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_order                ON public.team ("order");
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created  ON public.inquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_bookings_prop_dates ON public.property_bookings (property_id, start_date, end_date);


-- 3. Insert Seed Data (Properties)
INSERT INTO public.properties (name, slug, category, location, price, description, image_url, gallery, amenities, featured, "order") VALUES
('Villa Azure', 'villa-azure', 'Villas', 'Sidi Bou Said', '€4,500,000', 'Perched on the cliffs of Sidi Bou Said, Villa Azure offers unparalleled panoramic views of the Mediterranean Sea. This masterpiece of modern architecture seamlessly blends traditional Andalusian elements with contemporary luxury.', 'https://images.unsplash.com/photo-1613490908653-b8e72769cdac?q=80&w=1200&auto=format&fit=crop', '[]', '["Infinity Pool", "Private Beach Access", "Wine Cellar"]', true, 1),
('Dar El Jeld', 'dar-el-jeld', 'Hotels', 'La Medina, Tunis', 'From €450/night', 'Experience the pinnacle of Tunisian hospitality in this meticulously restored palace. Dar El Jeld is a journey back in time, offering unparalleled service and authenticity within the historic walls of the Medina.', '/dar-el-jeld.jpg', '[]', '["Spa & Hammam", "Michelin-star equivalent dining", "Rooftop Terrace"]', true, 2),
('Riva 76 Perseo', 'riva-76-perseo', 'Yachts', 'Port El Kantaoui', '€3,800,000', 'The Riva 76 Perseo strikes the perfect balance between sporty elegance and luxurious comfort. Cruising the Mediterranean has never been more stylish.', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=1200&auto=format&fit=crop', '[]', '["3 En-suite Cabins", "Jet Ski Garage", "Spacious Flybridge"]', true, 3),
('Ocean''s Edge', 'oceans-edge', 'Villas', 'Gammarth', '€6,200,000', 'A brutalist masterpiece meeting the sea. Ocean''s edge redefines coastal living with minimal intervention and maximum impact.', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop', '[]', '["Private Cinema", "Staff Quarters", "Direct Ocean Access"]', false, 4),
('Villa Carthage', 'villa-carthage', 'Villas', 'Carthage', '€5,100,000', 'Imbued with history, this estate sits adjacent to ancient ruins, offering a deeply rooted sense of place combined with ultra-modern comforts.', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop', '[]', '["Roman Baths", "Landscaped Gardens", "Security System"]', false, 5),
('Le Golfe', 'le-golfe', 'Restaurants', 'La Marsa', 'Varies', 'Dining redefined. Le Golfe marries the freshest Mediterranean ingredients with avant-garde culinary techniques in a setting that defies gravity.', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop', '[]', '["Sea Views", "Sommelier Selection", "Private Dining Room"]', false, 6),
('Palais Hammamet', 'palais-hammamet', 'Hotels', 'Hammamet', 'From €600/night', 'A sprawling estate transformed into a boutique experience, offering privacy and exclusivity on the cap bon peninsula.', 'https://images.unsplash.com/photo-1551882547-ff40c0d129df?q=80&w=1200&auto=format&fit=crop', '[]', '["Private Cabanas", "Helipad", "Equestrian Center"]', false, 7),
('The Residence', 'the-residence', 'Hotels', 'Gammarth', 'From €350/night', 'Leading the standard of five-star luxury, an architectural triumph bridging classic comfort with modern aesthetic sensibilities.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop', '[]', '["Thalasso Spa", "Golf Course", "Multiple Restaurants"]', false, 8),
('Cap Serrat Retreat', 'cap-serrat-retreat', 'Villas', 'Bizerte', '€2,900,000', 'For those seeking ultimate isolation. A remote, off-grid sanctuary where brutalism meets the wild northern coast.', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop', '[]', '["Solar Powered", "Private Cove", "Helicopter Access"]', false, 9);
