import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-black border-t-8 border-red-600 py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-3xl font-black tracking-tighter text-white uppercase">
              HORECAMATE<span className="text-red-600">.</span>
            </Link>
            <p className="mt-6 text-sm text-zinc-400 font-bold leading-relaxed uppercase tracking-widest">
              Premium commercial kitchen equipment for hotels and restaurants. Built for professionals.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-black text-white bg-red-600 inline-block px-2 py-1 mb-6 uppercase tracking-widest">Products</h3>
            <ul className="space-y-4">
              <li><Link to="/products?category=cooking" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Cooking Equipment</Link></li>
              <li><Link to="/products?category=refrigeration" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Refrigeration</Link></li>
              <li><Link to="/products?category=prep" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Food Preparation</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-black text-white bg-red-600 inline-block px-2 py-1 mb-6 uppercase tracking-widest">Support</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Warranty Information</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-black text-white bg-red-600 inline-block px-2 py-1 mb-6 uppercase tracking-widest">Company</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 border-t-2 border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">© 2026 Horecamate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
