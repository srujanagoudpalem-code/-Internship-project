import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Trash2, Loader, FileText } from 'lucide-react';
import api from '../services/api';

const returnSchema = z.object({
  orderNumber: z.string().min(1, { message: 'Order number is required' }),
  customerName: z.string().min(2, { message: 'Customer name is required' }),
  email: z.string().email({ message: 'Enter a valid email address' }),
  phone: z.string().min(5, { message: 'Phone number is required' }),
  issueType: z.enum([
    'DAMAGED_PRODUCT',
    'WRONG_CUSTOMIZATION',
    'MISSING_ITEMS',
    'LATE_DELIVERY',
    'WRONG_PRODUCT',
    'REPLACEMENT_REQUEST',
    'REFUND_REQUEST',
  ], {
    errorMap: () => ({ message: 'Please select an issue type' }),
  }),
  issueDescription: z.string().min(10, { message: 'Please provide at least 10 characters detailing the issue' }),
  preferredResolution: z.enum(['REFUND', 'REPLACEMENT'], {
    errorMap: () => ({ message: 'Please select a preferred resolution' }),
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

type ReturnForm = z.infer<typeof returnSchema>;

export const CreateReturn: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      customerName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      termsAccepted: false,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Limit to 5 images max
      if (selectedImages.length + filesArray.length > 5) {
        toast.error('You can upload a maximum of 5 images');
        return;
      }

      // Check sizes and extensions
      const validFiles = filesArray.filter((file) => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        if (!isValidType) toast.error(`${file.name} is not an image file.`);
        if (!isValidSize) toast.error(`${file.name} exceeds 5MB size limit.`);
        return isValidType && isValidSize;
      });

      setSelectedImages((prev) => [...prev, ...validFiles]);

      const filePreviews = validFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...filePreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    
    // Revoke object URL to avoid leaks
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReturnForm) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderNumber', data.orderNumber);
      formData.append('customerName', data.customerName);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('issueType', data.issueType);
      formData.append('issueDescription', data.issueDescription);
      formData.append('preferredResolution', data.preferredResolution);
      formData.append('termsAccepted', String(data.termsAccepted));

      selectedImages.forEach((img) => {
        formData.append('images', img);
      });

      await api.post('/returns', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Return request submitted successfully!');
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to submit return request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl glass"
      >
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">
          Raise Return/Replacement
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Fill out the form below. Our support team will review and contact you.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Order Number
              </label>
              <input
                type="text"
                {...register('orderNumber')}
                className={`w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                  errors.orderNumber ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all`}
                placeholder="e.g. ORD-98231A"
              />
              {errors.orderNumber && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.orderNumber.message}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                {...register('customerName')}
                className={`w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                  errors.customerName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all`}
              />
              {errors.customerName && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.customerName.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                className={`w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                  errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all`}
              />
              {errors.email && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                {...register('phone')}
                className={`w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                  errors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all`}
              />
              {errors.phone && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.phone.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Issue Type
              </label>
              <select
                {...register('issueType')}
                className={`w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                  errors.issueType ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all`}
              >
                <option value="">Select issue type</option>
                <option value="DAMAGED_PRODUCT">Damaged Product</option>
                <option value="WRONG_CUSTOMIZATION">Wrong Customization</option>
                <option value="MISSING_ITEMS">Missing Items</option>
                <option value="LATE_DELIVERY">Late Delivery</option>
                <option value="WRONG_PRODUCT">Wrong Product</option>
                <option value="REPLACEMENT_REQUEST">Replacement Request</option>
                <option value="REFUND_REQUEST">Refund Request</option>
              </select>
              {errors.issueType && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.issueType.message}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Preferred Resolution
              </label>
              <select
                {...register('preferredResolution')}
                className={`w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                  errors.preferredResolution ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all`}
              >
                <option value="">Select resolution</option>
                <option value="REPLACEMENT">Replacement</option>
                <option value="REFUND">Refund</option>
              </select>
              {errors.preferredResolution && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.preferredResolution.message}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Issue Description
            </label>
            <textarea
              {...register('issueDescription')}
              rows={4}
              className={`w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                errors.issueDescription ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all resize-none`}
              placeholder="Describe the issue in detail, including customization instructions if relevant..."
            />
            {errors.issueDescription && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.issueDescription.message}</span>
            )}
          </div>

          {/* Image upload component */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Upload Supporting Images (Max 5)
            </label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 rounded-xl p-6 text-center cursor-pointer transition-all bg-white/20 dark:bg-slate-900/20 relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click or drag images to upload (JPEG, PNG, WebP up to 5MB)
              </p>
            </div>

            {/* Thumbnail previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                {previews.map((src, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 mt-8">
            <input
              type="checkbox"
              {...register('termsAccepted')}
              id="terms"
              className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
            />
            <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400">
              I verify that all information, images, and customized details provided are accurate and correspond to the referenced order. I accept the store return policies.
            </label>
          </div>
          {errors.termsAccepted && (
            <span className="text-xs text-rose-500 mt-1 block">{errors.termsAccepted.message}</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" /> Submitting Request...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" /> Submit Return Request
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
export default CreateReturn;
