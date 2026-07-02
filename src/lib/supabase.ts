import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Validate URL format to prevent createClient from throwing an error
try {
  new URL(supabaseUrl);
} catch (error) {
  supabaseUrl = 'https://placeholder.supabase.co'; // Fallback to a valid URL format
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types derived from the database schema
export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category_id: string | null;
  images: string[];
  specifications: Record<string, any>;
  stock: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'customer';
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'negotiating' | 'processing' | 'out_of_delivery' | 'completed' | 'cancelled';
  shipping_address: Record<string, any>;
  created_at: string;
  updated_at: string;
};
