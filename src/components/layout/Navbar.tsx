import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, Briefcase } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useCartItemsCount } from '../../store/cart';
import { Button } from '../ui/Button';
import { motion } from 'motion/react';
import { SearchBar } from './SearchBar';

export function Navbar() {
  const { user } = useAuthStore();
  const totalItems = useCartItemsCount();

  return (
    <nav className="border-b-2 border-black bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-black tracking-tighter text-black flex items-center gap-2 uppercase">
              <span className="bg-red-600 text-white p-1">
                <Briefcase className="w-5 h-5" />
              </span>
              HORECAMATE
            </Link>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center px-8 z-50">
            <SearchBar />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-sm font-bold text-zinc-500 hover:text-black transition-colors uppercase tracking-widest">
              Products
            </Link>
            
            <Link to="/cart" className="relative group flex items-center">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <ShoppingCart className="h-5 w-5 text-zinc-500 group-hover:text-black transition-colors" />
              </motion.div>
              {totalItems > 0 && (
                <motion.span 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>

            {user ? (
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="rounded-none hover:bg-zinc-100 transition-colors">
                  <User className="h-5 w-5 text-black" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="font-bold px-5 uppercase tracking-wider rounded-none border-2 border-black hover:bg-black hover:text-white">Sign In</Button>
              </Link>
            )}
          </div>
          
          <div className="flex md:hidden items-center space-x-6">
            <Link to="/cart" className="relative group">
              <ShoppingCart className="h-5 w-5 text-zinc-500 group-hover:text-black transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
            <button className="text-zinc-500 hover:text-black transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
