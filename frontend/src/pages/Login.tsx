import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      
      // Determine redirection from localstorage updated by login
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        if (userObj.role === 'CUSTOMER') {
          navigate('/dashboard');
        } else {
          navigate('/admin');
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Login failed. Please check your credentials.');
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
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Sign in to manage your orders and return requests
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Forgot password?
              </Link>
            </div>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold transition-all shadow-md shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;
