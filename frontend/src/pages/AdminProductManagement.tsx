import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Gift, Plus, Search, Loader, Tag, DollarSign, FileText } from 'lucide-react';
import api from '../services/api';
import type { Product } from '../types';
import { useToast } from '../context/ToastContext';


const productSchema = z.object({
  sku: z.string().min(3, { message: 'SKU must be at least 3 characters' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  description: z.string().optional().nullable(),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Price must be a positive number',
  }),
  imageUrl: z.string().url({ message: 'Enter a valid image URL' }).or(z.string().length(0)).optional().nullable(),
});

type ProductForm = z.infer<typeof productSchema>;

export const AdminProductManagement: React.FC = () => {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/products');
      setProducts(res.data.data.products || []);
    } catch (e: any) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onSubmit = async (data: ProductForm) => {
    try {
      await api.post('/products', {
        ...data,
        price: parseFloat(data.price),
        imageUrl: data.imageUrl || undefined,
      });
      toast.success('Product created successfully!');
      reset();
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">
          Manage Products
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Catalog products available for returns and customized orders
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create Form */}
        <div className="p-6 rounded-2xl glass h-fit space-y-6">
          <h2 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary-500" />
            Add New Product
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">SKU Code</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  {...register('sku')}
                  placeholder="e.g. GIFT-MUG-123"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                />
              </div>
              {errors.sku && <span className="text-[10px] text-rose-500 mt-0.5 block">{errors.sku.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Product Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="Laser Engraved Photo Mug"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
              />
              {errors.name && <span className="text-[10px] text-rose-500 mt-0.5 block">{errors.name.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Unit Price ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  {...register('price')}
                  placeholder="24.99"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                />
              </div>
              {errors.price && <span className="text-[10px] text-rose-500 mt-0.5 block">{errors.price.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Product design and materials details..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Image URL</label>
              <input
                type="text"
                {...register('imageUrl')}
                placeholder="https://images.unsplash.com/photo..."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
              />
              {errors.imageUrl && <span className="text-[10px] text-rose-500 mt-0.5 block">{errors.imageUrl.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs transition-all shadow-md shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Create Product'}
            </button>
          </form>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white text-xs"
              />
            </div>
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Gift className="w-4 h-4 text-primary-500" /> Count: {filteredProducts.length} items
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-8 h-8 text-primary-500 animate-spin mb-2" />
              <p className="text-sm text-slate-500">Loading catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No products found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <div key={p.id} className="flex gap-4 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/10 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-850">
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-500">{p.sku}</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{p.description || 'No description'}</p>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400">${Number(p.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminProductManagement;
