import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import { supabase, Product, Category } from '../lib/supabase';
import { mockProducts, mockCategories } from '../lib/mock';
import { ProductCard } from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import Fuse from 'fuse.js';

const SYNONYMS: Record<string, string[]> = {
  "refrigerator": ["fridge", "cooler", "freezer"],
  "gas stove": ["burner", "cooktop", "range"],
  "stainless steel work table": ["steel table", "prep table"],
  "combi oven": ["combination oven", "steamer"],
  "deck oven": ["pizza oven", "baking oven"],
  "oven": ["baking", "roasting"],
};

export function Products() {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categoriesRes = await supabase.from('categories').select('*');
        if (!categoriesRes.error) {
          setCategories(categoriesRes.data as Category[] || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchInitialProducts() {
      setIsLoading(true);
      setPage(0);
      try {
        if (searchQuery) {
          // Fetch all for client-side fuzzy search
          const { data, error } = await supabase.from('products').select('*, categories(*)');
          if (error) throw error;
          
          let allData = data as Product[];
          
          // Apply Synonyms and Fuse search
          const enriched = allData.map(prod => {
            let matchedSynonyms: string[] = [];
            const text = (prod.name + " " + (prod.categories?.name || '')).toLowerCase();
            
            for (const [key, values] of Object.entries(SYNONYMS)) {
              if (text.includes(key)) matchedSynonyms.push(...values);
              for (const val of values) {
                if (text.includes(val)) {
                  matchedSynonyms.push(key);
                  matchedSynonyms.push(...values.filter(v => v !== val));
                }
              }
            }
            return {
              ...prod,
              searchTerms: matchedSynonyms.join(' ')
            };
          });

          const fuse = new Fuse(enriched, {
            keys: [
              { name: 'name', weight: 2 },
              { name: 'categories.name', weight: 1.5 },
              { name: 'searchTerms', weight: 1 }
            ],
            threshold: 0.4,
            ignoreLocation: true,
          });

          const results = fuse.search(searchQuery).map(r => r.item);
          setAllProducts(results);
          setProducts(results.slice(0, PAGE_SIZE));
          setHasMore(results.length > PAGE_SIZE);
        } else {
          // Standard pagination
          let query = supabase.from('products').select('*, categories(*)', { count: 'exact' });
          
          if (categorySlug && categories.length > 0) {
            const cat = categories.find(c => c.slug === categorySlug);
            if (cat) query = query.eq('category_id', cat.id);
          }

          const { data, count, error } = await query.range(0, PAGE_SIZE - 1);
          
          if (error) throw new Error('Products fetch failed');
          setProducts(data as Product[]);
          setHasMore(count !== null && count > PAGE_SIZE);
        }
      } catch (error) {
        console.error('Fetch failed, using mock data:', error);
        let filteredProducts = mockProducts;
        if (categorySlug) {
          filteredProducts = mockProducts.filter(p => p.categories?.slug === categorySlug);
        }
        setProducts(filteredProducts.slice(0, PAGE_SIZE));
        setHasMore(filteredProducts.length > PAGE_SIZE);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (categories.length > 0 || !categorySlug) {
      fetchInitialProducts();
    }
  }, [categorySlug, categories, searchQuery]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      if (searchQuery) {
        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE;
        setProducts(prev => [...prev, ...allProducts.slice(from, to)]);
        setPage(nextPage);
        setHasMore(allProducts.length > to);
      } else {
        let query = supabase.from('products').select('*, categories(*)', { count: 'exact' });
        
        if (categorySlug && categories.length > 0) {
          const cat = categories.find(c => c.slug === categorySlug);
          if (cat) query = query.eq('category_id', cat.id);
        }

        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, count, error } = await query.range(from, to);
        
        if (error) throw new Error('Products fetch failed');
        setProducts(prev => [...prev, ...(data as Product[])]);
        setPage(nextPage);
        setHasMore(count !== null && count > to + 1);
      }
    } catch (error) {
      console.error('Load more failed', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b-2 border-black">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-black tracking-tighter text-black leading-none uppercase">
            {searchQuery ? `Search: ${searchQuery}` : categorySlug ? `${categories.find(c => c.slug === categorySlug)?.name || categorySlug}` : 'All Equipment'}
          </h1>
          <p className="mt-2 text-red-600 font-bold uppercase tracking-widest text-sm">
             {searchQuery ? allProducts.length : (products.length > 0 ? (hasMore ? `${products.length}+` : products.length) : 0)} {products.length === 1 ? 'product' : 'products'} found
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="mt-6 md:mt-0 flex items-center space-x-4">
          <button className="flex items-center text-sm font-black text-black bg-white border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] hover:shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] hover:-translate-y-0.5 uppercase tracking-widest">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="hidden lg:block col-span-1">
          <div className="sticky top-24 bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black text-black uppercase tracking-widest mb-6 border-b-2 border-black pb-2">Categories</h3>
            <ul className="space-y-2 relative">
              <li>
                <Link to="/products" className={`block px-3 py-2 text-sm transition-colors border-2 ${!categorySlug && !searchQuery ? 'bg-black text-white border-black font-black uppercase tracking-widest' : 'border-transparent text-black font-bold uppercase tracking-widest hover:border-black'}`}>
                  All Categories
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link to={`/products?category=${c.slug}`} className={`block px-3 py-2 text-sm transition-colors border-2 ${categorySlug === c.slug ? 'bg-black text-white border-black font-black uppercase tracking-widest' : 'border-transparent text-black font-bold uppercase tracking-widest hover:border-black'}`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Product Grid */}
        <div className="col-span-1 lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                  <div className="bg-zinc-200 aspect-[4/3] mb-4 border-2 border-black" />
                  <div className="p-2 flex flex-col flex-1">
                    <div className="h-5 bg-zinc-200 w-3/4 mb-3" />
                    <div className="h-4 bg-zinc-200 w-1/4 mb-4" />
                    <div className="mt-auto h-6 bg-zinc-200 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <motion.div 
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence>
                {products.map((product) => (
                  <motion.div key={product.id} variants={itemVariants} layoutId={product.id} className="h-full flex flex-col">
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {hasMore && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center mt-8">
                  <button 
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="bg-black text-white px-8 py-3 font-black uppercase tracking-widest hover:bg-red-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More Products'}
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-32 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-16 h-16 bg-red-600 flex items-center justify-center mx-auto mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                 <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black mb-2 uppercase tracking-wide">No products found</h3>
              <p className="text-zinc-600 mb-8 font-bold">Try adjusting your filters or search query.</p>
              <Link to="/products" className="inline-block bg-black text-white px-6 py-3 font-black uppercase tracking-widest hover:bg-red-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Clear search</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
