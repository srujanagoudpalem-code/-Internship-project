import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Lock, Loader } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userId = searchParams.get('userId') || '';
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    if (!userId || !token) {
      toast.error('Invalid password reset session. Please request a new link.');
      return;
    }
    try {
      await resetPassword(userId, token, data.password);
      toast.success('Password updated successfully! You can now log in.');
      navigate('/login');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Password reset failed.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 rounded-2xl glass"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">
            Set New Password
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Create a secure password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                {...register('password')}
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                  errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.password.message}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                {...register('confirmPassword')}
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                  errors.confirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold transition-all shadow-md shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
export default ResetPassword;
