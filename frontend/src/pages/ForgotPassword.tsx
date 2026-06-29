import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
});

type ForgotForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      await forgotPassword(data.email);
      setSubmitted(true);
      toast.success('Reset link dispatched successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error processing request');
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
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        {submitted ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              We have dispatched a password recovery reset link to your email address if an account is associated with it.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">
                Reset Password
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Enter your email address and we'll dispatch a link to reset your password
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    {...register('email')}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border ${
                      errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                    } focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-rose-500 mt-1 block">{errors.email.message}</span>
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
                  'Send Reset Link'
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};
export default ForgotPassword;
