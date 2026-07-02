import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Product } from '../lib/supabase';
import { mockProducts } from '../lib/mock';
import { Button } from '../components/ui/Button';
import { useCartStore } from '../store/cart';
import { formatCurrency } from '../lib/utils';
import { Check, ShoppingCart, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('products').select('*, categories(*)').eq('id', id).single();
        if (error || !data) throw new Error('Product not found in DB');
        setProduct(data as Product);
      } catch (err) {
        console.error('Fetch failed, using mock data:', err);
        const mockP = mockProducts.find(p => p.id === id);
        if (mockP) setProduct(mockP);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      <p className="mt-4 text-zinc-500 font-medium">Loading equipment details...</p>
    </div>
  );
  
  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
       <h2 className="text-2xl font-bold text-zinc-900 mb-2">Product Not Found</h2>
       <p className="text-zinc-500 mb-6">The equipment you're looking for doesn't exist or is no longer available.</p>
       <Link to="/products"><Button>Return to Catalog</Button></Link>
    </div>
  );

  const imageUrl = product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=800&q=80';

  let specs = {};
  if (product.specifications) {
    if (typeof product.specifications === 'string') {
      try {
         specs = JSON.parse(product.specifications);
      } catch (err) {
         console.error("Failed to parse specifications", err);
      }
    } else if (typeof product.specifications === 'object') {
      specs = product.specifications;
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div variants={itemVariants} className="mb-8">
        <Link to="/products" className="inline-flex items-center text-sm font-black text-black hover:text-red-600 transition-colors uppercase tracking-widest">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalog
        </Link>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        <motion.div variants={itemVariants} className="aspect-[4/3] md:aspect-square bg-zinc-50 overflow-hidden relative border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <motion.img
             initial={{ scale: 1.05 }}
             animate={{ scale: 1 }}
             transition={{ duration: 0.6 }}
             src={imageUrl}
             alt={product.name}
             className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
          />
        </motion.div>
        
        <div className="flex flex-col">
          <motion.div variants={itemVariants} className="mb-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-white bg-red-600 px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
               {product.categories?.name}
             </span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-3xl font-black text-black sm:text-4xl lg:text-5xl leading-tight mb-4 uppercase">{product.name}</motion.h1>
          <motion.p variants={itemVariants} className="text-4xl font-black text-black mb-8">{formatCurrency(product.price)}</motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col p-8 bg-white border-2 border-black space-y-4 mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Button 
               size="lg" 
               className="w-full text-base font-black py-6 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]"
               onClick={handleAddToCart}
               disabled={product.stock <= 0}
            >
              {isAdded ? (
                <span className="flex items-center"><Check className="mr-2 h-5 w-5" /> Added to Cart</span>
              ) : (
                <span className="flex items-center"><ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart</span>
              )}
            </Button>
            
            <div className="flex gap-4 pt-4 border-t-2 border-black border-dashed mt-4">
              <a 
                href={`https://wa.me/919599668974?text=${encodeURIComponent(`Hi, I am inquiring about the product: ${product.name}\nSKU ID: ${product.id}\nPrice: ${formatCurrency(product.price)}\n\nCan we negotiate the price or discuss bulk order?`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-500 hover:text-white flex items-center justify-center gap-2 font-black uppercase tracking-wider h-14">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.37 1.25 4.8L2 22l5.35-1.18A9.973 9.973 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.74 14.15c-.24.67-1.4 1.27-1.95 1.34-.48.06-1.12.11-3.17-.74-2.81-1.16-4.63-4.05-4.77-4.24-.14-.19-1.14-1.52-1.14-2.9 0-1.38.72-2.06.98-2.32.22-.22.56-.29.83-.29.13 0 .25.01.35.01.28 0 .42.01.62.48.24.59.69 1.69.75 1.82.06.13.1.28.02.43-.08.15-.12.24-.24.38-.11.14-.24.31-.34.42-.12.14-.25.28-.1.54.15.26.67 1.11 1.44 1.79.99.88 1.82 1.15 2.08 1.27.26.12.41.1.56-.07.15-.17.65-.75.82-1.01.17-.26.35-.22.59-.13.24.1 1.54.73 1.81.87.26.14.44.21.5.33.06.12.06.69-.18 1.36z" clipRule="evenodd"/></svg>
                  Negotiate
                </Button>
              </a>
              <a 
                href={`mailto:anshbnsingh28@gmail.com?subject=${encodeURIComponent(`Product Inquiry: ${product.name}`)}&body=${encodeURIComponent(`I would like to inquire about the following product:\n\nName: ${product.name}\nPrice: ${formatCurrency(product.price)}\nSKU/ID: ${product.id}\n\nPlease let me know if there's any room for negotiation or availability.`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-black text-black hover:bg-black hover:text-white flex items-center justify-center gap-2 font-black uppercase tracking-wider h-14">
                  Email Us
                </Button>
              </a>
            </div>

            {product.stock > 0 ? (
              <p className="text-sm text-green-600 font-bold flex items-center justify-center uppercase tracking-widest mt-4">
                 <span className="w-2 h-2 bg-green-500 mr-2 border border-black"></span>
                 In stock ({product.stock})
              </p>
            ) : (
              <p className="text-sm text-red-600 font-bold text-center uppercase tracking-widest mt-4 pt-4">Out of stock</p>
            )}
          </motion.div>
          
          <motion.div variants={itemVariants} className="border-t-2 border-black pt-8 mb-10">
            <h3 className="text-xl font-black text-black mb-4 uppercase tracking-wider">Product Description</h3>
            <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed text-lg font-medium">{product.description}</p>
          </motion.div>
          
          {Object.keys(specs).length > 0 && (
            <motion.div variants={itemVariants} className="border-t-2 border-black pt-8">
               <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2 uppercase tracking-wider">
                  Technical Specifications
               </h3>
               <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                 {Object.entries(specs).map(([key, value]) => (
                   <div key={key} className="flex flex-col border-b-2 border-zinc-100 pb-2">
                     <dt className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</dt>
                     <dd className="text-base font-black text-black">{String(value)}</dd>
                   </div>
                 ))}
               </dl>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
