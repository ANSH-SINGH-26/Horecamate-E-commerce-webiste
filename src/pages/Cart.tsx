import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore, useCartTotal } from '../store/cart';
import { formatCurrency } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth';

export function Cart() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const totalPrice = useCartTotal();
  const shippingFee = totalPrice > 0 ? 250 : 0;
  const totalWithShipping = totalPrice + shippingFee;
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">Your cart is empty</h2>
        <p className="text-zinc-500 mb-8">Looks like you haven't added any products to your cart yet.</p>
        <Link to="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <ul className="border-t-2 border-black">
            {items.map((item) => (
              <li key={item.product.id} className="flex py-8 sm:py-10 border-b-2 border-black">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden border-2 border-black sm:h-48 sm:w-48 bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <img
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=800&q=80'}
                    alt={item.product.name}
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-xl font-black uppercase">
                          <Link to={`/products/${item.product.id}`} className="text-black hover:text-red-600 transition-colors">
                            {item.product.name}
                          </Link>
                        </h3>
                      </div>
                      <p className="mt-1 text-xs font-black text-red-600 uppercase tracking-widest">{item.product.categories?.name}</p>
                      <p className="mt-2 text-lg font-black text-black">{formatCurrency(item.product.price)}</p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9 flex items-center justify-start sm:justify-end">
                      <div className="flex items-center space-x-3 border-2 border-black bg-white p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-black hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-black border-2 border-transparent"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-black text-black w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-black hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-black border-2 border-transparent"
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="absolute right-0 top-0 sm:top-1 sm:right-1">
                        <button
                          type="button"
                          className="text-black hover:bg-red-600 hover:text-white border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-all p-2"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <span className="sr-only">Remove</span>
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white p-6 sm:p-8 border-2 border-black sticky top-24 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black text-black mb-6 uppercase tracking-wider border-b-2 border-black pb-4">Order Summary</h2>
            
            <div className="flow-root">
              <dl className="-my-4 divide-y-2 divide-zinc-100 text-sm">
                <div className="flex items-center justify-between py-4">
                  <dt className="text-black font-black uppercase tracking-widest text-xs">Subtotal</dt>
                  <dd className="font-black text-black">{formatCurrency(totalPrice)}</dd>
                </div>
                <div className="flex items-center justify-between py-4">
                  <dt className="text-black font-black uppercase tracking-widest text-xs">Shipping</dt>
                  <dd className="font-black text-black">{formatCurrency(shippingFee)}</dd>
                </div>
                <div className="flex items-center justify-between py-4">
                  <dt className="text-lg font-black text-black uppercase tracking-widest text-red-600">Order total</dt>
                  <dd className="text-2xl font-black text-black">{formatCurrency(totalWithShipping)}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <Button onClick={handleCheckout} size="lg" className="w-full">
                Proceed to Checkout
              </Button>

              <div className="flex flex-col gap-3 mt-4 pt-4 border-t-2 border-black border-dashed">
                <p className="text-xs font-black uppercase text-center text-zinc-500 mb-1 tracking-widest">Want to negotiate your order?</p>
                <div className="flex gap-2">
                  <a 
                    href={`https://wa.me/919599668974?text=${encodeURIComponent(`Hi, I would like to negotiate my order.\n\nItems:\n${items.map(item => `- ${item.quantity}x ${item.product.name} (${formatCurrency(item.product.price)})`).join('\n')}\n\nTotal: ${formatCurrency(totalWithShipping)}`)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-500 hover:text-white flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs px-2 shadow-[2px_2px_0px_0px_rgba(34,197,94,1)]">
                      WhatsApp
                    </Button>
                  </a>
                  <a 
                    href={`mailto:anshbnsingh28@gmail.com?subject=${encodeURIComponent(`Order Negotiation Inquiry`)}&body=${encodeURIComponent(`Hi, I would like to negotiate the following order:\n\nItems:\n${items.map(item => `- ${item.quantity}x ${item.product.name} (SKU: ${item.product.id}) - ${formatCurrency(item.product.price)}`).join('\n')}\n\nTotal: ${formatCurrency(totalWithShipping)}\n\nPlease let me know.`)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full border-black text-black hover:bg-black hover:text-white flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      Email
                    </Button>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm font-black uppercase tracking-widest">
              <p>
                <span className="text-zinc-500">OR </span>
                <Link to="/products" className="text-red-600 hover:text-black border-b-2 border-red-600 hover:border-black transition-colors">
                  Continue Shopping
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
