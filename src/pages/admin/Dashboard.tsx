import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Users as UsersIcon,
  LogOut,
  LayoutDashboard,
  Settings,
  BarChart2,
} from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { supabase } from "../../lib/supabase";
import { formatCurrency, cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";

// Admin Components
import { ProductsManager } from "./ProductsManager";
import { OrdersManager } from "./OrdersManager";
import { UsersManager } from "./UsersManager";
import { AdminAnalytics } from "./AdminAnalytics";

export function Dashboard() {
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "products" | "orders" | "users"
  >("overview");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    async function fetchDashboardData() {
      if (profile?.role === "admin") {
        const { data: orders } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (orders) {
          setStats({
            totalOrders: orders.length,
            totalSales: orders.reduce(
              (sum, order) => sum + Number(order.total_amount),
              0,
            ),
          });
          setRecentOrders(orders.slice(0, 5));
        }
      } else {
        const { data: orders } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });
        if (orders) {
          setStats({
            totalOrders: orders.length,
            totalSales: orders.reduce(
              (sum, order) => sum + Number(order.total_amount),
              0,
            ),
          });
          setRecentOrders(orders);
        }
      }
    }

    fetchDashboardData();
  }, [user, profile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-zinc-50">
      {/* Sidebar for Admin */}
      {isAdmin && (
        <aside className="w-64 flex-shrink-0 bg-white border-r border-zinc-200 overflow-y-auto">
          <div className="p-6">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Admin Panel
            </p>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md font-medium transition-colors",
                  activeTab === "overview"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" /> Overview
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md font-medium transition-colors",
                  activeTab === "analytics"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <BarChart2 className="mr-3 h-5 w-5" /> Analytics
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md font-medium transition-colors",
                  activeTab === "products"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <Package className="mr-3 h-5 w-5" /> Products
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md font-medium transition-colors",
                  activeTab === "orders"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <ShoppingBag className="mr-3 h-5 w-5" /> Orders
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-md font-medium transition-colors",
                  activeTab === "users"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <UsersIcon className="mr-3 h-5 w-5" /> Users
              </button>
            </nav>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                {isAdmin ? "Dashboard" : "My Account"}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Welcome back, {profile?.full_name || user?.email}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>

          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-zinc-200 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-zinc-900 rounded-md p-3">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-zinc-500">
                          {isAdmin ? "Total Orders" : "My Orders"}
                        </dt>
                        <dd className="text-2xl font-semibold text-zinc-900">
                          {stats.totalOrders}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-zinc-200 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-zinc-900 rounded-md p-3">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="truncate text-sm font-medium text-zinc-500">
                          {isAdmin ? "Total Revenue" : "Total Spent"}
                        </dt>
                        <dd className="text-2xl font-semibold text-zinc-900">
                          {formatCurrency(stats.totalSales)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm border border-zinc-200 rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-zinc-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium leading-6 text-zinc-900">
                    Recent Orders
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      View All &rarr;
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-zinc-200">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 text-center text-sm text-zinc-500"
                          >
                            No orders found.
                          </td>
                        </tr>
                      ) : (
                        recentOrders.map((order) => (
                          <React.Fragment key={order.id}>
                            <tr className="hover:bg-zinc-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                                {order.id.substring(0, 8)}...
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                {new Date(
                                  order.created_at,
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                  ${
                                    order.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : order.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : order.status === "negotiating"
                                          ? "bg-blue-100 text-blue-800"
                                          : order.status === "processing"
                                            ? "bg-indigo-100 text-indigo-800"
                                            : order.status === "out_of_delivery"
                                              ? "bg-orange-100 text-orange-800"
                                              : "bg-zinc-100 text-zinc-800"
                                  }`}
                                >
                                  {typeof order.status === 'string' ? order.status.replace('_', ' ') : order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 font-medium">
                                {formatCurrency(Number(order.total_amount))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={async () => {
                                    if ((order as any).showItems) {
                                      setRecentOrders((prev) =>
                                        prev.map((o) =>
                                          o.id === order.id
                                            ? { ...o, showItems: false }
                                            : o,
                                        ),
                                      );
                                    } else {
                                      const { data: items } = await supabase
                                        .from("order_items")
                                        .select("*, products(name, images)")
                                        .eq("order_id", order.id);
                                      if (items) {
                                        setRecentOrders((prev) =>
                                          prev.map((o) =>
                                            o.id === order.id
                                              ? { ...o, items, showItems: true }
                                              : o,
                                          ),
                                        );
                                      }
                                    }
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  {(order as any).showItems ? "Hide" : "View"}
                                </button>
                              </td>
                            </tr>
                            {(order as any).showItems &&
                              (order as any).items && (
                                <tr className="bg-zinc-50">
                                  <td colSpan={5} className="px-6 py-4">
                                    <div className="text-sm">
                                      <h4 className="font-semibold mb-2 text-zinc-900">
                                        Items Ordered:
                                      </h4>
                                      {(order as any).items.length > 0 ? (
                                        <ul className="space-y-2">
                                          {(order as any).items.map(
                                            (item: any) => (
                                              <li
                                                key={item.id}
                                                className="flex justify-between items-center bg-white p-2 rounded border border-zinc-200"
                                              >
                                                <div className="flex items-center gap-3">
                                                  {item.products
                                                    ?.images?.[0] && (
                                                    <img
                                                      src={
                                                        item.products.images[0]
                                                      }
                                                      alt={item.products.name}
                                                      className="w-10 h-10 object-cover rounded"
                                                    />
                                                  )}
                                                  <span className="font-medium">
                                                    {item.products?.name ||
                                                      "Unknown Product"}
                                                  </span>
                                                  <span className="text-zinc-500">
                                                    x{item.quantity}
                                                  </span>
                                                </div>
                                                <span>
                                                  {formatCurrency(
                                                    item.unit_price *
                                                      item.quantity,
                                                  )}
                                                </span>
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      ) : (
                                        <p className="text-zinc-500 italic">
                                          No items found for this order.
                                          (Checkout may have failed partially)
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "analytics" && isAdmin && <AdminAnalytics />}
          {activeTab === "products" && isAdmin && <ProductsManager />}
          {activeTab === "orders" && isAdmin && <OrdersManager />}
          {activeTab === "users" && isAdmin && <UsersManager />}
        </div>
      </main>
    </div>
  );
}
