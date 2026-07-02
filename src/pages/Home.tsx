import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase, Product, Category } from '../lib/supabase';
import { mockProducts, mockCategories } from '../lib/mock';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/Button';

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          supabase.from('products').select('*, categories(*)').eq('is_featured', true).limit(4),
          supabase.from('categories').select('*').limit(3)
        ]);

        if (productsRes.error) {
          console.error('Products error:', productsRes.error);
        }
        if (categoriesRes.error) {
          console.error('Categories error:', categoriesRes.error);
        }

        if (productsRes.error || categoriesRes.error) {
          throw new Error('Failed to fetch data from Supabase. Make sure your environment variables are set and the SQL setup script has been run.');
        }
        
        setFeaturedProducts(productsRes.data as Product[]);
        setCategories(categoriesRes.data as Category[]);
      } catch (error) {
        console.error('Supabase fetch failed, falling back to mock data:', error);
        setFeaturedProducts(mockProducts.filter(p => p.is_featured));
        setCategories(mockCategories);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      {/* Hero Section */}
      <div className="relative bg-black border-b-4 border-red-600">
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80"
            alt="Commercial Kitchen"
            className="h-full w-full object-cover mix-blend-overlay grayscale opacity-50"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 lg:py-48 flex flex-col items-center justify-center min-h-[80vh] text-center">
          <motion.h1 
            variants={itemVariants}
            className="text-5xl font-black tracking-tighter text-white sm:text-6xl lg:text-7xl max-w-4xl leading-tight uppercase"
          >
            Professional Equipment <br/>
            <span className="text-red-600">for Modern Kitchens</span>
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="mt-6 max-w-2xl text-xl text-zinc-400 font-medium leading-relaxed"
          >
            Premium commercial kitchen equipment curated for hotels, restaurants, and catering services. Fast delivery. Reliable support.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap justify-center gap-6">
            <Link to="/products">
              <Button size="lg" className="bg-red-600 text-white hover:bg-red-700 rounded-none px-8 py-6 text-lg font-bold shadow-xl transition-transform hover:scale-105 uppercase tracking-wider">
                Shop Equipment
              </Button>
            </Link>
            <a href="https://wa.me/919599668974?text=Hi%2C%20I%20would%20like%20to%20inquire%20about%20your%20products." target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white bg-black/50 backdrop-blur-sm rounded-none px-8 py-6 text-lg font-bold transition-transform hover:scale-105 uppercase tracking-wider flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.37 1.25 4.8L2 22l5.35-1.18A9.973 9.973 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.74 14.15c-.24.67-1.4 1.27-1.95 1.34-.48.06-1.12.11-3.17-.74-2.81-1.16-4.63-4.05-4.77-4.24-.14-.19-1.14-1.52-1.14-2.9 0-1.38.72-2.06.98-2.32.22-.22.56-.29.83-.29.13 0 .25.01.35.01.28 0 .42.01.62.48.24.59.69 1.69.75 1.82.06.13.1.28.02.43-.08.15-.12.24-.24.38-.11.14-.24.31-.34.42-.12.14-.25.28-.1.54.15.26.67 1.11 1.44 1.79.99.88 1.82 1.15 2.08 1.27.26.12.41.1.56-.07.15-.17.65-.75.82-1.01.17-.26.35-.22.59-.13.24.1 1.54.73 1.81.87.26.14.44.21.5.33.06.12.06.69-.18 1.36z" clipRule="evenodd"/></svg>
                WhatsApp Us
              </Button>
            </a>
            <a href="mailto:anshbnsingh28@gmail.com?subject=Product Inquiry" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="border-red-600 text-white hover:bg-red-600 hover:text-white bg-black/50 backdrop-blur-sm rounded-none px-8 py-6 text-lg font-bold transition-transform hover:scale-105 uppercase tracking-wider gap-2">
                Email Us
              </Button>
            </a>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 bg-white"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-black tracking-tighter text-black mb-12 flex items-center gap-4 uppercase">
            <span className="w-12 h-1 bg-red-600 inline-block"></span>
            Shop by Category
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div key={category.id} variants={itemVariants} whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <Link to={`/products?category=${category.slug}`} className="group relative block h-80 overflow-hidden bg-black shadow-lg">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    src={category.image_url || ''}
                    alt={category.name}
                    className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity group-hover:opacity-90" />
                  <div className="absolute bottom-0 left-0 p-8 w-full">
                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">{category.name}</h3>
                    <div className="h-1 w-12 bg-red-600 transform origin-left transition-all duration-300 group-hover:w-full"></div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Featured Products */}
      <div className="bg-zinc-50 py-24 border-t-2 border-black">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <motion.div variants={itemVariants} className="flex items-end justify-between mb-12">
            <div>
               <h2 className="text-3xl font-black tracking-tighter text-black flex items-center gap-4 uppercase">
                 <span className="w-12 h-1 bg-red-600 inline-block"></span>
                 Featured Products
               </h2>
               <p className="text-zinc-600 mt-2 max-w-2xl text-lg font-medium">Discover our selection of premium equipment designed for professional performance and durability.</p>
            </div>
            <Link to="/products" className="group hidden md:flex text-sm font-bold text-red-600 items-center hover:text-red-700 transition-colors uppercase tracking-wider">
              View all products 
              <span className="ml-2 transform transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </motion.div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col">
                  <div className="bg-zinc-200 aspect-square mb-4 shadow-sm" />
                  <div className="h-5 bg-zinc-200 w-3/4 mb-3" />
                  <div className="h-4 bg-zinc-200 w-1/4 mb-4" />
                  <div className="h-10 bg-zinc-200 mt-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {featuredProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants} className="h-full flex flex-col">
                   <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
          
          <div className="mt-12 flex justify-center md:hidden">
            <Link to="/products">
              <Button variant="outline" className="px-8 border-zinc-300">View all products</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
