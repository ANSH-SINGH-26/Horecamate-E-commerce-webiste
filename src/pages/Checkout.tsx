import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore, useCartTotal } from "../store/cart";
import { useAuthStore } from "../store/auth";
import { formatCurrency } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { supabase } from "../lib/supabase";

export function Checkout() {
  const { items, clearCart } = useCartStore();
  const totalPrice = useCartTotal();
  const shippingFee = totalPrice > 0 ? 250 : 0;
  const totalWithShipping = totalPrice + shippingFee;
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "US",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/checkout");
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError("");

    try {
      // 1. Create Order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: totalWithShipping,
          status: "pending",
          shipping_address: shipping,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = items
        .filter((item) => !item.product.id.startsWith("prod-")) // Skip mock products
        .map((item) => ({
          order_id: orderData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
        }));

      if (orderItems.length > 0) {
        // Verify products still exist in the database (to prevent foreign key constraint violations)
        const productIds = orderItems.map(item => item.product_id);
        const { data: existingProducts } = await supabase
          .from("products")
          .select("id")
          .in("id", productIds);
          
        const existingProductIds = new Set(existingProducts?.map(p => p.id) || []);
        const validOrderItems = orderItems.filter(item => existingProductIds.has(item.product_id));

        if (validOrderItems.length > 0) {
          const { error: itemsError } = await supabase
            .from("order_items")
            .insert(validOrderItems);

          if (itemsError) throw itemsError;
        }

        if (validOrderItems.length !== orderItems.length) {
          console.warn("Some items were removed from the order because they no longer exist in the shop.");
        }
      } else if (items.some((item) => item.product.id.startsWith("prod-"))) {
        console.warn(
          "Some items were mock products and were not saved to the database.",
        );
      }

      // 3. Complete Checkout (Mock Stripe integration)
      clearCart();

      // Trigger backend notification
      try {
        await fetch("/api/notify-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderData.id,
            shipping,
            items: items.map((item) => ({
              quantity: item.quantity,
              product: {
                name: item.product.name,
                price: item.product.price,
                id: item.product.id,
              },
            })),
            totalWithShipping,
          }),
        });
      } catch (notifyError) {
        console.error("Failed to trigger backend notification:", notifyError);
      }

      navigate("/", { state: { message: "Order placed successfully!" } });
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to place order. Please try again.");
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate("/products")}>Return to Shop</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <form onSubmit={handlePlaceOrder} className="space-y-8">
            <div>
              <h2 className="text-xl font-medium text-zinc-900 mb-4">
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    required
                    name="fullName"
                    value={shipping.fullName}
                    onChange={handleChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    required
                    name="phone"
                    type="tel"
                    value={shipping.phone}
                    onChange={handleChange}
                    placeholder="+91..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Address
                  </label>
                  <Input
                    required
                    name="address"
                    value={shipping.address}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    City
                  </label>
                  <Input
                    required
                    name="city"
                    value={shipping.city}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Postal Code
                  </label>
                  <Input
                    required
                    name="postalCode"
                    value={shipping.postalCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-medium text-zinc-900 mb-4">
                Payment Method
              </h2>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-600">
                  This is a demo application. Clicking place order will simulate
                  a successful transaction and create an order in the database.
                </p>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            <Button
              type="submit"
              size="lg"
              className="w-full shadow-xl"
              isLoading={isSubmitting}
            >
              Place Order
            </Button>

            <div className="flex flex-col gap-3 mt-4 pt-4 border-t-2 border-zinc-200 border-dashed">
              <p className="text-xs font-bold uppercase text-center text-zinc-500 mb-1 tracking-widest">
                Want to negotiate before ordering?
              </p>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/919599668974?text=${encodeURIComponent(`Hi, I'm at the checkout and would like to negotiate my order.\n\nShipping details:\nName: ${shipping.fullName}\nLocation: ${shipping.city}, ${shipping.country}\n\nItems:\n${items.map((item) => `- ${item.quantity}x ${item.product.name} (${formatCurrency(item.product.price)})`).join("\n")}\n\nTotal: ${formatCurrency(totalWithShipping)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-green-500 text-green-600 hover:bg-green-500 hover:text-white flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs px-2 shadow-sm rounded-md"
                  >
                    WhatsApp Us
                  </Button>
                </a>
                <a
                  href={`mailto:anshbnsingh28@gmail.com?subject=${encodeURIComponent(`Order Negotiation Inquiry`)}&body=${encodeURIComponent(`Hi, I would like to negotiate the following order details.\n\nShipping Details:\nName: ${shipping.fullName}\nAddress: ${shipping.address}, ${shipping.city}, ${shipping.postalCode}, ${shipping.country}\n\nItems:\n${items.map((item) => `- ${item.quantity}x ${item.product.name} (SKU: ${item.product.id}) - ${formatCurrency(item.product.price)}`).join("\n")}\n\nTotal: ${formatCurrency(totalWithShipping)}\n\nPlease let me know if we can discuss the pricing.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-zinc-800 text-zinc-800 hover:bg-zinc-800 hover:text-white flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs px-2 shadow-sm rounded-md"
                  >
                    Email Us
                  </Button>
                </a>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
            <h2 className="text-lg font-medium text-zinc-900 mb-4">
              Order Summary
            </h2>
            <ul className="divide-y divide-zinc-200">
              {items.map((item) => (
                <li key={item.product.id} className="py-4 flex">
                  <div className="h-16 w-16 bg-white rounded border border-zinc-200 flex-shrink-0">
                    <img
                      src={item.product.images?.[0]}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1 flex flex-col justify-center">
                    <span className="text-sm font-medium text-zinc-900">
                      {item.product.name}
                    </span>
                    <span className="text-sm text-zinc-500">
                      Qty: {item.quantity}
                    </span>
                  </div>
                  <div className="ml-4 flex items-center">
                    <span className="text-sm font-medium text-zinc-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-4 border-t border-zinc-200 pt-6 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-600">Subtotal</dt>
                <dd className="font-medium text-zinc-900">
                  {formatCurrency(totalPrice)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-4 mt-4">
                <dt className="text-zinc-600">Shipping</dt>
                <dd className="font-medium text-zinc-900">
                  {formatCurrency(shippingFee)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
                <dt className="text-base font-bold text-zinc-900">Total</dt>
                <dd className="text-base font-bold text-zinc-900">
                  {formatCurrency(totalWithShipping)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
