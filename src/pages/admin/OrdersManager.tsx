import React, { useState, useEffect } from 'react';
import { supabase, Order } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, profiles(email, full_name)')
      .order('created_at', { ascending: false });
      
    if (data) setOrders(data);
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert('Failed to update status: ' + error.message);
    } else {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } as any : o));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    const { data: order } = await supabase
      .from('orders')
      .select('*, profiles(email, full_name)')
      .eq('id', orderId)
      .single();
      
    const { data: items } = await supabase
      .from('order_items')
      .select('*, products(name, images)')
      .eq('order_id', orderId);
      
    if (order && items) {
      setSelectedOrder({ ...order, items });
    }
  };

  if (isLoading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-900">Manage Orders</h2>
      </div>

      {selectedOrder ? (
        <div className="bg-white p-6 rounded-lg border border-zinc-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold">Order Details #{selectedOrder.id.substring(0, 8)}</h3>
              <p className="text-sm text-zinc-500">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Back to Orders</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-2">Customer Information</h4>
              <p className="text-sm">Name: {selectedOrder.profiles?.full_name || 'N/A'}</p>
              <p className="text-sm">Email: {selectedOrder.profiles?.email || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Shipping Address</h4>
              <p className="text-sm">{selectedOrder.shipping_address?.fullName}</p>
              <p className="text-sm">{selectedOrder.shipping_address?.address}</p>
              <p className="text-sm">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.postalCode}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Update Status</h4>
            <div className="flex gap-2">
              {['pending', 'negotiating', 'processing', 'out_of_delivery', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    selectedOrder.status === status 
                      ? 'bg-zinc-900 text-white' 
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Items Ordered</h4>
            <ul className="divide-y divide-zinc-200">
              {selectedOrder.items?.map((item: any) => (
                <li key={item.id} className="py-4 flex gap-4">
                  <div className="w-16 h-16 bg-zinc-100 rounded overflow-hidden">
                    <img src={item.products?.images?.[0]} alt={item.products?.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.products?.name}</p>
                      <p className="text-sm text-zinc-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.unit_price * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center py-4 border-t border-zinc-200 mt-4">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">{formatCurrency(selectedOrder.total_amount)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-zinc-200 rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
              {orders.map((order: any) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                    {order.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {order.profiles?.email || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize 
                      ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        order.status === 'negotiating' ? 'bg-blue-100 text-blue-800' : 
                        order.status === 'processing' ? 'bg-indigo-100 text-indigo-800' : 
                        order.status === 'out_of_delivery' ? 'bg-orange-100 text-orange-800' : 
                        'bg-zinc-100 text-zinc-800'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                    {formatCurrency(Number(order.total_amount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end">
                    <button onClick={() => viewOrderDetails(order.id)} className="text-zinc-600 hover:text-zinc-900">
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
