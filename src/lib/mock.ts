import { Product, Category } from './supabase';

export const mockCategories: Category[] = [
  {
    id: 'cats-1',
    name: 'Cooking Equipment',
    slug: 'cooking-equipment',
    image_url: 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=800&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cats-2',
    name: 'Refrigeration',
    slug: 'refrigeration',
    image_url: 'https://images.unsplash.com/photo-1596647240366-0dbb69c47e7d?w=800&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 'cats-3',
    name: 'Food Preparation',
    slug: 'food-preparation',
    image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
    created_at: new Date().toISOString(),
  }
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Commercial Gas Range 6-Burner',
    slug: 'gas-range-6-burner',
    description: 'Heavy-duty commercial gas range with 6 burners and standard oven base. Ideal for high-volume restaurants.',
    price: 2499.00,
    category_id: 'cats-1',
    images: ['https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80'],
    specifications: { power: "180,000 BTU", dimensions: "36\" x 32\" x 56\"", material: "Stainless Steel" },
    stock: 15,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: mockCategories[0]
  },
  {
    id: 'prod-2',
    name: 'Double Door Reach-In Refrigerator',
    slug: 'double-door-fridge',
    description: 'Premium stainless steel reach-in refrigerator with digital temperature control and LED lighting.',
    price: 3250.00,
    category_id: 'cats-2',
    images: ['https://images.unsplash.com/photo-1584269600519-112d071b4d08?w=800&q=80'],
    specifications: { capacity: "47 cu. ft.", dimensions: "54\" x 32\" x 82\"", power: "115V" },
    stock: 8,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: mockCategories[1]
  },
  {
    id: 'prod-3',
    name: 'Commercial Stand Mixer 20 Qt',
    slug: 'stand-mixer-20-qt',
    description: 'Heavy-duty 20-quart planetary stand mixer. Includes bowl, wire whip, dough hook, and flat beater.',
    price: 1150.00,
    category_id: 'cats-3',
    images: ['https://plus.unsplash.com/premium_photo-1661608975878-8fc8ebf35f79?w=800&q=80'],
    specifications: { capacity: "20 Qt", motor: "1.5 HP", speeds: 3 },
    stock: 25,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: mockCategories[2]
  }
];
