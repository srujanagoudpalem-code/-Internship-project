import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  AlertCircle,
  Loader,
} from 'lucide-react';
import api from '../services/api';
import type { ReturnRequest } from '../types';
import { useToast } from '../context/ToastContext';


export const CustomerDashboard: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const toast = useToast();

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/returns');
      setReturns(res.data.data.returns || []);
    } catch (e: any) {
      toast.error('Failed to load return requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleCancelRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this return request?')) return;
    try {
      await api.delete(`/returns/${id}`);
      toast.success('Return request cancelled successfully.');
      fetchReturns();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to cancel return request.');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30';
      case 'APPROVED':
      case 'REFUND_COMPLETED':
      case 'REPLACEMENT_SHIPPED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
      case 'REJECTED':
      case 'CLOSED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/30';
    }
  };

  // Filter returns client-side for rapid response
  const filteredReturns = returns.filter((ret) => {
    const matchesSearch =
      ret.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.issueType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || ret.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: returns.length,
    pending: returns.filter((r) => r.status === 'PENDING').length,
    completed: returns.filter((r) => ['REFUND_COMPLETED', 'REPLACEMENT_SHIPPED', 'CLOSED'].includes(r.status)).length,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">
            Return Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Raise requests and track return/replacement status
          </p>
        </div>
        <Link
          to="/returns/new"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold shadow-md shadow-primary-500/25 transition-all"
        >
          <Plus className="w-5 h-5" />
          File Return Request
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl glass flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/30 text-primary-500 rounded-xl flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total Requests</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl glass flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/30 text-amber-500 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pending}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pending Action</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl glass flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.completed}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Resolved/Closed</p>
          </div>
        </motion.div>
      </div>

      {/* Filters and List */}
      <div className="p-6 rounded-2xl glass space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search request or order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Filter by:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all text-sm w-full md:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="REFUND_COMPLETED">Refund Completed</option>
              <option value="REPLACEMENT_SHIPPED">Replacement Shipped</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-8 h-8 text-primary-500 animate-spin mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading requests...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Return Requests</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              We couldn't find any return or replacement requests matching your selection.
            </p>
            {returns.length === 0 && (
              <Link
                to="/returns/new"
                className="mt-6 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold shadow-md text-sm transition-all"
              >
                Submit Your First Request
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-slate-900/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Order No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Issue Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Preferred Resolution
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date Filed
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {filteredReturns.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200">
                        <Link to={`/returns/${item.id}`} className="hover:text-primary-500 underline decoration-dotted">
                          #{item.id.substring(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {item.order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {item.issueType.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {item.preferredResolution}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold flex items-center justify-end gap-2">
                        <Link
                          to={`/returns/${item.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                        >
                          Details <ChevronRight className="w-4 h-4" />
                        </Link>
                        {item.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelRequest(item.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 rounded-lg text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default CustomerDashboard;
