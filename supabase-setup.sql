-- Horecamate Supabase Schema & Setup

-- 1. Create Tables

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}'::jsonb,
  stock INTEGER DEFAULT 0 NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'customer')) DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'negotiating', 'processing', 'out_of_delivery', 'completed', 'cancelled')) DEFAULT 'pending',
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 2. Create Triggers

-- Trigger to update 'updated_at' on products
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_modtime ON products;
CREATE TRIGGER update_products_modtime
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_orders_modtime ON orders;
CREATE TRIGGER update_orders_modtime
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories Policies
DROP POLICY IF EXISTS "Categories are viewable by everyone." ON categories;
CREATE POLICY "Categories are viewable by everyone." ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert categories." ON categories;
CREATE POLICY "Admins can insert categories." ON categories FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can update categories." ON categories;
CREATE POLICY "Admins can update categories." ON categories FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete categories." ON categories;
CREATE POLICY "Admins can delete categories." ON categories FOR DELETE USING (is_admin());

-- Products Policies
DROP POLICY IF EXISTS "Products are viewable by everyone." ON products;
CREATE POLICY "Products are viewable by everyone." ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert products." ON products;
CREATE POLICY "Admins can insert products." ON products FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can update products." ON products;
CREATE POLICY "Admins can update products." ON products FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete products." ON products;
CREATE POLICY "Admins can delete products." ON products FOR DELETE USING (is_admin());

-- Orders Policies
DROP POLICY IF EXISTS "Users can view their own orders." ON orders;
CREATE POLICY "Users can view their own orders." ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can insert their own orders." ON orders;
CREATE POLICY "Users can insert their own orders." ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can update order status." ON orders;
CREATE POLICY "Admins can update order status." ON orders FOR UPDATE USING (is_admin());

-- Order Items Policies
DROP POLICY IF EXISTS "Users can view their own order items." ON order_items;
CREATE POLICY "Users can view their own order items." ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin()))
);
DROP POLICY IF EXISTS "Users can insert order items for their own orders." ON order_items;
CREATE POLICY "Users can insert order items for their own orders." ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);


-- 4. Storage Bucket for Product Images
-- Note: You run this in the SQL editor since you can't create buckets strictly through standard DDL, 
-- but Supabase allows it via their custom schema.
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- Storage RLS
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Admin Insert" ON storage.objects;
CREATE POLICY "Admin Insert"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' AND is_admin() );

DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'product-images' AND is_admin() );

DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-images' AND is_admin() );


-- 5. Seed Data

INSERT INTO categories (name, slug, image_url) VALUES 
('Cooking Equipment', 'cooking-equipment', 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=800&q=80'),
('Refrigeration', 'refrigeration', 'https://images.unsplash.com/photo-1596647240366-0dbb69c47e7d?w=800&q=80'),
('Food Preparation', 'food-preparation', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80'),
('Beverage Equipment', 'beverage-equipment', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&q=80'),
('Office & Workspace', 'office-workspace', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80'),
('Point of Sale', 'point-of-sale', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'),
('Crockery & Tableware', 'crockery-tableware', 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=800&q=80')
ON CONFLICT(name) DO NOTHING;

-- Products
WITH cats AS (SELECT id, slug FROM categories)
INSERT INTO products (name, slug, description, price, category_id, images, stock, is_featured, specifications) VALUES
('Commercial Gas Range 6-Burner', 'gas-range-6-burner', 'Heavy-duty commercial gas range with 6 burners and standard oven base. Ideal for high-volume restaurants.', 185000.00, (SELECT id FROM cats WHERE slug = 'cooking-equipment'), ARRAY['https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80'], 15, true, '{"power": "180,000 BTU", "dimensions": "36\" x 32\" x 56\"", "material": "Stainless Steel"}'),
('Double Door Reach-In Refrigerator', 'double-door-fridge', 'Premium stainless steel reach-in refrigerator with digital temperature control and LED lighting.', 245000.00, (SELECT id FROM cats WHERE slug = 'refrigeration'), ARRAY['https://images.unsplash.com/photo-1584269600519-112d071b4d08?w=800&q=80'], 8, true, '{"capacity": "47 cu. ft.", "dimensions": "54\" x 32\" x 82\"", "power": "115V"}'),
('Commercial Stand Mixer 20 Qt', 'stand-mixer-20-qt', 'Heavy-duty 20-quart planetary stand mixer. Includes bowl, wire whip, dough hook, and flat beater.', 85000.00, (SELECT id FROM cats WHERE slug = 'food-preparation'), ARRAY['https://plus.unsplash.com/premium_photo-1661608975878-8fc8ebf35f79?w=800&q=80'], 25, false, '{"capacity": "20 Qt", "motor": "1.5 HP", "speeds": 3}'),
('Professional Espresso Machine', 'pro-espresso-machine', 'Dual-boiler commercial espresso machine. Perfect for bustling cafes and offices.', 380000.00, (SELECT id FROM cats WHERE slug = 'beverage-equipment'), ARRAY['https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&q=80'], 10, true, '{"power": "220V", "boilers": 2, "material": "Stainless Steel"}'),
('Touchscreen POS System', 'touchscreen-pos', 'All-in-one Point of Sale terminal with 15-inch touchscreen, receipt printer, and cash drawer.', 55000.00, (SELECT id FROM cats WHERE slug = 'point-of-sale'), ARRAY['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'], 30, true, '{"screen": "15 inch capacitive", "os": "Windows 10 IoT", "storage": "128GB SSD"}'),
('Ergonomic Office Chair', 'ergonomic-office-chair', 'High-back mesh ergonomic office chair with adjustable lumbar support and 3D armrests.', 12500.00, (SELECT id FROM cats WHERE slug = 'office-workspace'), ARRAY['https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80'], 50, false, '{"material": "Mesh", "weight_capacity": "150 kg", "warranty": "3 Years"}'),
('Executive Conference Table', 'exec-conference-table', 'Modern 8-seater conference table with built-in power management and cable routing.', 45000.00, (SELECT id FROM cats WHERE slug = 'office-workspace'), ARRAY['https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80'], 5, true, '{"capacity": "8 Persons", "material": "Oak Wood & Steel", "dimensions": "240cm x 120cm"}'),
('Industrial Coffee Grinder', 'industrial-coffee-grinder', 'Flat burr coffee grinder with micro-metric adjustment for precise espresso dialing.', 65000.00, (SELECT id FROM cats WHERE slug = 'beverage-equipment'), ARRAY['https://images.unsplash.com/photo-1585822765369-026049ce4591?w=800&q=80'], 12, false, '{"burr_size": "83mm", "motor": "500W"}'),
('Stainless Steel Work Table', 'stainless-work-table', 'NSF-certified stainless steel prep table with under-shelf. 72 x 30 inches.', 18000.00, (SELECT id FROM cats WHERE slug = 'food-preparation'), ARRAY['https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&q=80'], 20, false, '{"material": "304 Stainless Steel", "dimensions": "72\" x 30\"", "certification": "NSF"}'),
('Porcelain Dinner Plates Set', 'porcelain-dinner-plates', 'Set of 24 classic white porcelain dinner plates, 10.5-inch diameter. Microwave and dishwasher safe.', 8500.00, (SELECT id FROM cats WHERE slug = 'crockery-tableware'), ARRAY['https://images.unsplash.com/photo-1617415494291-a1e948cfebce?w=800&q=80'], 40, true, '{"material": "Porcelain", "diameter": "10.5 inch", "pieces": 24}'),
('Fine Bone China Tea Set', 'bone-china-tea-set', 'Elegant 15-piece fine bone china tea set including teapot, sugar bowl, creamer, and 6 cups and saucers.', 14500.00, (SELECT id FROM cats WHERE slug = 'crockery-tableware'), ARRAY['https://images.unsplash.com/photo-1594498653385-d5172c532c00?w=800&q=80'], 15, true, '{"material": "Bone China", "pieces": 15}'),
('Crystal Wine Glasses Set', 'crystal-wine-glasses', 'Set of 12 premium lead-free crystal wine glasses for fine dining and wine tasting.', 6000.00, (SELECT id FROM cats WHERE slug = 'crockery-tableware'), ARRAY['https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80'], 25, false, '{"material": "Lead-Free Crystal", "capacity": "450ml", "pieces": 12}'),
('Stainless Steel Cutlery Set', 'stainless-cutlery-set', 'Heavyweight 18/10 stainless steel 72-piece cutlery set for commercial use. Resists rust and spotting.', 11000.00, (SELECT id FROM cats WHERE slug = 'crockery-tableware'), ARRAY['https://images.unsplash.com/photo-1590480378411-cf62df94d210?w=800&q=80'], 30, false, '{"material": "18/10 Stainless Steel", "pieces": 72}'),
('Commercial Deep Fryer', 'commercial-deep-fryer', 'Dual basket commercial deep fryer, stainless steel body with adjustable thermostat.', 35000.00, (SELECT id FROM cats WHERE slug = 'cooking-equipment'), ARRAY['https://images.unsplash.com/photo-1632778149955-f2d2ae6759fc?w=800&q=80'], 10, true, '{"power": "220V", "capacity": "2 x 6 Liters", "material": "Stainless Steel"}'),
('Heavy Duty Meat Slicer', 'heavy-duty-meat-slicer', 'Professional 10-inch blade meat and cheese slicer. Ideal for delis and high-volume kitchens.', 42000.00, (SELECT id FROM cats WHERE slug = 'food-preparation'), ARRAY['https://plus.unsplash.com/premium_photo-1664112065842-be0cc38699bf?w=800&q=80'], 8, false, '{"blade_size": "10 inch", "motor": "240W", "material": "Aluminum alloy"}'),
('Ceramic Serving Bowls Set', 'ceramic-serving-bowls', 'Set of 6 rustic ceramic serving bowls perfect for salads and family-style service.', 5500.00, (SELECT id FROM cats WHERE slug = 'crockery-tableware'), ARRAY['https://images.unsplash.com/photo-1603893605670-65e317c2a792?w=800&q=80'], 20, false, '{"material": "Ceramic", "pieces": 6, "capacity": "1.5 Liters"}'),
('Undercounter Ice Maker', 'undercounter-ice-maker', 'Produces up to 100 lbs of clear ice cubes daily. Compact undercounter design.', 68000.00, (SELECT id FROM cats WHERE slug = 'refrigeration'), ARRAY['https://images.unsplash.com/photo-1582236814631-419b48f9dd18?w=800&q=80'], 15, true, '{"capacity": "100 lbs/day", "storage": "30 lbs", "power": "115V"}'),
('Bar Inventory Software', 'bar-inventory-software', 'Cloud-based bar and restaurant inventory management software subscription (1 Year).', 24000.00, (SELECT id FROM cats WHERE slug = 'point-of-sale'), ARRAY['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80'], 100, false, '{"format": "Digital Access", "duration": "1 Year"}'),
('Stoneware Coffee Mugs', 'stoneware-coffee-mugs', 'Set of 24 durable stoneware coffee mugs in mixed earth tones. Perfect for diners and cafes.', 4800.00, (SELECT id FROM cats WHERE slug = 'crockery-tableware'), ARRAY['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80'], 40, false, '{"material": "Stoneware", "capacity": "12 oz", "pieces": 24}')
ON CONFLICT(slug) DO NOTHING;
