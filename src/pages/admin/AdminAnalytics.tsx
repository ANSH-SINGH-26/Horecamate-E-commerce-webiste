import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [customerBehavior, setCustomerBehavior] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        // Fetch all orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (ordersError) throw ordersError;

        // Fetch all order items with product details
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*, products(name)');
          
        if (itemsError) throw itemsError;

        // Process Sales Trend Data
        const salesByTime: Record<string, number> = {};
        
        orders?.forEach(order => {
          const date = new Date(order.created_at);
          let key = '';
          
          if (timeRange === 'daily') {
            key = date.toLocaleDateString();
          } else if (timeRange === 'weekly') {
            // Get week number
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
            const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
            key = `Week ${weekNumber}, ${date.getFullYear()}`;
          } else if (timeRange === 'monthly') {
            key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          }
          
          salesByTime[key] = (salesByTime[key] || 0) + Number(order.total_amount);
        });

        const formattedSalesData = Object.keys(salesByTime).map(key => ({
          name: key,
          sales: salesByTime[key]
        }));
        
        setSalesData(formattedSalesData);

        // Process Top Products
        const productSales: Record<string, {name: string, quantity: number, revenue: number}> = {};
        
        orderItems?.forEach((item: any) => {
          const productId = item.product_id;
          const name = item.products?.name || 'Unknown Product';
          
          if (!productSales[productId]) {
            productSales[productId] = { name, quantity: 0, revenue: 0 };
          }
          
          productSales[productId].quantity += item.quantity;
          productSales[productId].revenue += (item.quantity * item.unit_price);
        });

        const sortedProducts = Object.values(productSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5); // Top 5
          
        setTopProducts(sortedProducts);

        // Process Customer Purchase Behavior (Order status distribution)
        const statusCounts: Record<string, number> = {};
        orders?.forEach(order => {
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });
        
        const formattedBehavior = Object.keys(statusCounts).map(key => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: statusCounts[key]
        }));
        
        setCustomerBehavior(formattedBehavior);

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [timeRange]);

  if (isLoading) {
    return <div className="py-12 flex justify-center text-zinc-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Sales Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Sales Trends</h3>
          <div className="flex space-x-2">
            {(['daily', 'weekly', 'monthly'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md transition-colors capitalize ${
                  timeRange === range 
                    ? 'bg-zinc-900 text-white' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72 w-full">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickMargin={10} />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <RechartsTooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#18181b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-400">No sales data available</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <h3 className="text-lg font-bold mb-6">Best Selling Products (by Quantity)</h3>
          <div className="h-64 w-full">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={10} width={100} />
                  <RechartsTooltip 
                    cursor={{fill: '#f4f4f5'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }}
                  />
                  <Bar dataKey="quantity" fill="#18181b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400">No product data available</div>
            )}
          </div>
        </div>

        {/* Customer Behavior (Order Status) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <h3 className="text-lg font-bold mb-6">Customer Purchase Behavior (Order Status)</h3>
          <div className="h-64 w-full">
            {customerBehavior.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerBehavior}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {customerBehavior.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400">No order data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
