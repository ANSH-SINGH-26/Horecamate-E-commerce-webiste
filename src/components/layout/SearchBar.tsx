import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'motion/react';

const SYNONYMS: Record<string, string[]> = {
  "refrigerator": ["fridge", "cooler", "freezer"],
  "gas stove": ["burner", "cooktop", "range"],
  "stainless steel work table": ["steel table", "prep table"],
  "combi oven": ["combination oven", "steamer"],
  "deck oven": ["pizza oven", "baking oven"],
  "oven": ["baking", "roasting"],
};

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close dropdown on click outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSearchData = async () => {
    if (items.length > 0) return; // Already loaded
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('id, name, slug, price, images, categories(id, name, slug)'),
        supabase.from('categories').select('id, name, slug, image_url')
      ]);

      const formattedItems: any[] = [];

      if (categoriesRes.data) {
        categoriesRes.data.forEach((cat: any) => {
          let matchedSynonyms: string[] = [];
          const text = cat.name.toLowerCase();
          for (const [key, values] of Object.entries(SYNONYMS)) {
            if (text.includes(key)) matchedSynonyms.push(...values);
            for (const val of values) {
              if (text.includes(val)) {
                matchedSynonyms.push(key);
                matchedSynonyms.push(...values.filter(v => v !== val));
              }
            }
          }

          formattedItems.push({
            type: 'category',
            id: cat.id,
            slug: cat.slug,
            title: cat.name,
            subtitle: 'Category',
            image: cat.image_url,
            searchTerms: matchedSynonyms.join(' ')
          });
        });
      }

      if (productsRes.data) {
        productsRes.data.forEach((prod: any) => {
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

          formattedItems.push({
            type: 'product',
            id: prod.id,
            slug: prod.slug,
            title: prod.name,
            subtitle: prod.categories?.name || '',
            price: prod.price,
            image: prod.images?.[0],
            searchTerms: matchedSynonyms.join(' ')
          });
        });
      }

      setItems(formattedItems);
    } catch (err) {
      console.error("Error fetching search data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query.length > 0) {
      if (items.length === 0) {
        fetchSearchData();
      } else {
        performSearch(query);
      }
    } else {
      setResults([]);
    }
  }, [query, items]);

  const performSearch = (searchQuery: string) => {
    const fuse = new Fuse(items, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'subtitle', weight: 1.5 },
        { name: 'searchTerms', weight: 1 }
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });

    const res = fuse.search(searchQuery);
    setResults(res.slice(0, 8).map(r => r.item));
  };

  const handleSelect = (item: any) => {
    setIsOpen(false);
    setQuery('');
    if (item.type === 'category') {
      navigate(`/products?category=${item.slug}`);
    } else {
      navigate(`/products/${item.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      setIsOpen(false);
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <div className="w-full max-w-md relative group flex-1" ref={wrapperRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-black transition-colors" />
      <input
        type="text"
        placeholder="SEARCH EQUIPMENT, BRANDS..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          if (items.length === 0) fetchSearchData();
        }}
        onKeyDown={handleKeyDown}
        className="w-full h-10 pl-10 pr-10 rounded-none border-2 border-zinc-200 bg-zinc-50 text-xs font-bold focus:outline-none focus:border-red-600 focus:bg-white transition-all uppercase tracking-widest placeholder:text-zinc-400 text-black"
      />
      {query && (
        <button 
          onClick={() => { setQuery(''); setResults([]); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {isOpen && query.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 max-h-[70vh] overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 flex justify-center items-center text-zinc-500 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-bold tracking-widest uppercase">Loading...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col">
                {results.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className={`flex items-center gap-4 p-3 hover:bg-zinc-100 cursor-pointer transition-colors border-b border-zinc-100 ${index === results.length - 1 ? 'border-b-0' : ''}`}
                  >
                    {item.image ? (
                      <div className="w-12 h-12 bg-zinc-100 flex-shrink-0 flex items-center justify-center border border-zinc-200 overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-zinc-100 flex-shrink-0 flex items-center justify-center border border-zinc-200">
                        <Search className="w-5 h-5 text-zinc-300" />
                      </div>
                    )}
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-sm font-bold text-black truncate">{item.title}</span>
                      <span className="text-xs text-zinc-500 uppercase tracking-wider truncate">
                        {item.type === 'category' ? '📁 Category' : item.subtitle}
                      </span>
                    </div>
                    {item.type === 'product' && item.price && (
                      <span className="font-bold text-red-600 text-sm whitespace-nowrap">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
                
                <div 
                  className="p-3 text-center bg-zinc-50 text-xs font-bold tracking-widest uppercase border-t-2 border-black hover:bg-zinc-100 cursor-pointer"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
                    setQuery('');
                  }}
                >
                  View All Search Results &rarr;
                </div>
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-zinc-300" />
                <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No results found for "{query}"</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
