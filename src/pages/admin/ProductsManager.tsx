import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase, Product, Category } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string, step: 'confirm' | 'force_confirm' } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category_id: '',
    stock: '',
    images: '',
    is_featured: false,
  });

  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const [isBulkUploading, setIsBulkUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setIsLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const [pRes, cRes] = await Promise.all([
      supabase.from('products').select('*, categories(*)', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to),
      supabase.from('categories').select('*').order('name', { ascending: true })
    ]);
    
    if (pRes.data) setProducts(pRes.data);
    if (pRes.count !== null) setTotalCount(pRes.count);
    if (cRes.data) setCategories(cRes.data);
    setIsLoading(false);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkUploading(true);
    try {
      const text = await file.text();
      let data: any[] = [];
      
      try {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        if (result.errors.length > 0) {
           console.error('CSV parse errors:', result.errors);
           throw new Error('Errors found while parsing CSV.');
        }
        data = result.data;
      } catch (err) {
        throw new Error('Invalid CSV format. Please upload a valid CSV file.');
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('CSV file must contain valid product rows.');
      }

      // Format payload
      const payloads = data.map((item: any) => ({
        name: item.name,
        slug: item.slug || (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : Math.random().toString(36).substring(7)),
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        category_id: item.category_id || null, // Optional, can be handled if they know the UUID
        stock: parseInt(item.stock, 10) || 0,
        images: Array.isArray(item.images) ? item.images : (typeof item.images === 'string' ? item.images.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
        is_featured: item.is_featured === 'true' || item.is_featured === true || item.is_featured === '1',
      })).filter((item: any) => item.name); // only include rows with a valid name

      if (payloads.length === 0) {
        throw new Error('No valid products found in the CSV file.');
      }

      const { error } = await supabase.from('products').insert(payloads);
      if (error) throw error;

      setAlertMessage(`Successfully uploaded ${payloads.length} products!`);
      await fetchData();
    } catch (error: any) {
      setAlertMessage('Error during bulk upload: ' + error.message);
    } finally {
      setIsBulkUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      
      setFormData(prev => ({
        ...prev,
        images: prev.images ? `${prev.images}, ${data.publicUrl}` : data.publicUrl
      }));
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', price: '', category_id: '', stock: '', images: '', is_featured: false });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id || '',
      stock: product.stock.toString(),
      images: product.images.join(', '),
      is_featured: product.is_featured,
    });
    setEditingId(product.id);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setProductToDelete({ id, step: 'confirm' });
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const { id, step } = productToDelete;

    if (step === 'confirm') {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        setProducts(prev => prev.filter(p => p.id !== id));
        setProductToDelete(null);
      } else {
        console.error(error);
        if (error.code === '23503' || error.message.toLowerCase().includes('foreign key')) {
          setProductToDelete({ id, step: 'force_confirm' });
        } else {
          setAlertMessage('Error deleting product: ' + error.message);
          setProductToDelete(null);
        }
      }
    } else if (step === 'force_confirm') {
      await supabase.from('order_items').delete().eq('product_id', id);
      const { error: retryError } = await supabase.from('products').delete().eq('id', id);
      
      if (!retryError) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        setAlertMessage('Error force deleting product: ' + retryError.message);
        console.error(retryError);
      }
      setProductToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      description: formData.description,
      price: parseFloat(formData.price),
      category_id: formData.category_id || null,
      stock: parseInt(formData.stock, 10) || 0,
      images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
      is_featured: formData.is_featured,
    };

    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) setAlertMessage('Error updating product: ' + error.message);
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) setAlertMessage('Error creating product: ' + error.message);
    }
    
    await fetchData();
    resetForm();
  };

  if (isLoading) return <div>Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-900">Manage Products</h2>
        {!isFormOpen && (
          <div className="flex gap-2">
            <div className="relative">
              <Button type="button" variant="outline" disabled={isBulkUploading} className="flex items-center bg-white">
                {isBulkUploading ? 'Uploading...' : 'Bulk Upload (CSV)'}
              </Button>
              <input 
                type="file" 
                accept=".csv"
                onChange={handleBulkUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isBulkUploading}
              />
            </div>
            <Button onClick={() => setIsFormOpen(true)} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-200 relative mb-8">
          <button onClick={resetForm} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input required name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (optional)</label>
                <Input name="slug" value={formData.slug} onChange={handleInputChange} placeholder="auto-generated if empty" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <Input required type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <Input required type="number" name="stock" value={formData.stock} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select 
                  name="category_id" 
                  value={formData.category_id} 
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Images (comma separated URLs)</label>
                <div className="flex gap-2">
                  <Input name="images" value={formData.images} onChange={handleInputChange} className="flex-1" />
                  <div className="relative">
                    <Button type="button" variant="outline" disabled={isUploading}>
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white"
                />
              </div>
              <div className="md:col-span-2 flex items-center mt-2">
                <input 
                  type="checkbox" 
                  id="is_featured" 
                  name="is_featured" 
                  checked={formData.is_featured} 
                  onChange={handleInputChange} 
                  className="mr-2"
                />
                <label htmlFor="is_featured" className="text-sm font-medium text-zinc-900">Featured Product</label>
              </div>
            </div>
            <div className="pt-4">
              <Button type="submit">{editingId ? 'Update Product' : 'Save Product'}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm border border-zinc-200 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-200">
            {products.map(p => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{p.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{formatCurrency(p.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{p.categories?.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                  <button onClick={() => handleEdit(p)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteRequest(p.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-zinc-600">
          Showing {products.length > 0 ? page * PAGE_SIZE + 1 : 0} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} products
        </span>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= totalCount}
          >
            Next
          </Button>
        </div>
      </div>

      {alertMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-red-600">Notice</h3>
            <p className="text-zinc-900 mb-6">{alertMessage}</p>
            <div className="flex justify-end">
              <Button onClick={() => setAlertMessage(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-red-600">
              {productToDelete.step === 'confirm' ? 'Delete Product' : 'Force Delete Product'}
            </h3>
            <p className="text-zinc-600 font-medium mb-6">
              {productToDelete.step === 'confirm' 
                ? 'Are you sure you want to delete this product? This action cannot be undone.'
                : 'This product cannot be deleted because it is part of existing orders. Would you like to force delete it? (This will remove it from past order records)'}
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setProductToDelete(null)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
                 Yes, {productToDelete.step === 'confirm' ? 'Delete' : 'Force Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
