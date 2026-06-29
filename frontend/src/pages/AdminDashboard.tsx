import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileDown,
  Search,
  Filter,
  BarChart2,
  PieChart as PieIcon,
  LineChart as LineIcon,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Loader,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import api from '../services/api';
import type { DashboardStats, ReturnRequest, RequestStatus } from '../types';
import { useToast } from '../context/ToastContext';

import { Link } from 'react-router-dom';

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];

export const AdminDashboard: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'analytics' | 'requests'>('analytics');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  
  // Requests list states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [issueFilter, setIssueFilter] = useState('');
  const [resolutionFilter, setResolutionFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);

  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchStats = async () => {
    try {
      setIsStatsLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (e: any) {
      toast.error('Failed to load dashboard analytics.');
    } finally {
      setIsStatsLoading(false);
    }
  };

  const fetchRequestsList = async () => {
    try {
      setIsListLoading(true);
      const res = await api.get('/returns', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          issueType: issueFilter || undefined,
          preferredResolution: resolutionFilter || undefined,
          sortBy,
          sortOrder,
          page,
          limit: 10,
        },
      });
      setRequests(res.data.data.returns || []);
      setTotalPages(res.data.pages || 1);
      setTotalRequests(res.data.total || 0);
    } catch (e: any) {
      toast.error('Failed to load request records.');
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequestsList();
    }
  }, [activeTab, search, statusFilter, issueFilter, resolutionFilter, sortBy, sortOrder, page]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/returns/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `returns_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV report downloaded successfully.');
    } catch (e) {
      toast.error('Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50';
      case 'APPROVED':
      case 'REFUND_COMPLETED':
      case 'REPLACEMENT_SHIPPED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50';
      case 'REJECTED':
      case 'CLOSED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">
            Admin Workspace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage store product returns, assignments, and audit trails
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Analytics Dashboard
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Request Logs
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        /* ANALYTICS TAB CONTENT */
        isStatsLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader className="w-8 h-8 text-primary-500 animate-spin mb-2" />
            <p className="text-sm text-slate-500">Compiling statistics...</p>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Top Cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl glass">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.summary.total}</span>
                    <p className="text-xs font-semibold text-slate-400">Total Requests</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl glass">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.summary.pending}</span>
                    <p className="text-xs font-semibold text-slate-400">Pending Actions</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl glass">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.summary.approved}</span>
                    <p className="text-xs font-semibold text-slate-400">Approved Requests</p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl glass">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.summary.today}</span>
                    <p className="text-xs font-semibold text-slate-400">Submitted Today</p>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Trend Line Chart */}
              <div className="p-6 rounded-2xl glass lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <LineIcon className="w-4 h-4 text-primary-500" /> Return Submission Trends (Last 7 Days)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.dailyTrend}>
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Issue Type Pie Chart */}
              <div className="p-6 rounded-2xl glass space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-primary-500" /> Issue Breakdown
                </h3>
                <div className="h-64 w-full flex items-center justify-center">
                  {stats.issueTypeDistribution.length === 0 ? (
                    <span className="text-sm text-slate-400">No data available</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.issueTypeDistribution}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name }) => name.substring(0, 10)}
                        >
                          {stats.issueTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Resolutions Bar Chart and Recent Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Resolutions Bar Chart */}
              <div className="p-6 rounded-2xl glass space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-500" /> Preferred Resolutions
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.resolutions}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {stats.resolutions.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* System Audit Activity */}
              <div className="p-6 rounded-2xl glass lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" /> Recent Operations Log
                </h3>
                <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                  {stats.recentActivity.length === 0 ? (
                    <p className="text-sm text-slate-400 py-6 text-center">No logs generated yet.</p>
                  ) : (
                    stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex justify-between items-start gap-4 text-xs bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-205/50 dark:border-slate-800/30">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            Request{' '}
                            <Link to={`/returns/${activity.requestId}`} className="underline text-primary-500">
                              #{activity.requestId.substring(0, 8)}
                            </Link>{' '}
                            for {activity.customerName} updated to{' '}
                            <span className="font-bold text-indigo-500">{activity.status.replace('_', ' ')}</span>
                          </p>
                          {activity.note && <p className="text-slate-400 italic">"{activity.note}"</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-600 dark:text-slate-400 block">{activity.updatedBy}</span>
                          <span className="text-[10px] text-slate-400">{new Date(activity.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>No statistics found</p>
        )
      ) : (
        /* REQUESTS LIST LOGS TAB CONTENT */
        <div className="p-6 rounded-2xl glass space-y-6">
          
          {/* Top Actions: Search, Filter, Export */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, phone, order..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white text-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white text-xs"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="REPLACEMENT_SHIPPED">Replacement Shipped</option>
                <option value="REFUND_COMPLETED">Refund Completed</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                value={issueFilter}
                onChange={(e) => { setIssueFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white text-xs"
              >
                <option value="">All Issue Types</option>
                <option value="DAMAGED_PRODUCT">Damaged Product</option>
                <option value="WRONG_CUSTOMIZATION">Wrong Customization</option>
                <option value="MISSING_ITEMS">Missing Items</option>
                <option value="LATE_DELIVERY">Late Delivery</option>
                <option value="WRONG_PRODUCT">Wrong Product</option>
                <option value="REPLACEMENT_REQUEST">Replacement Request</option>
                <option value="REFUND_REQUEST">Refund Request</option>
              </select>

              <select
                value={resolutionFilter}
                onChange={(e) => { setResolutionFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white text-xs"
              >
                <option value="">All Resolutions</option>
                <option value="REPLACEMENT">Replacement</option>
                <option value="REFUND">Refund</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 text-primary-500 text-xs font-semibold shrink-0 transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Export CSV Report
            </button>
          </div>

          {/* Request Records Table */}
          {isListLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-8 h-8 text-primary-500 animate-spin mb-2" />
              <p className="text-sm text-slate-500">Loading records...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400">No return requests found matching criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-slate-900/10">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Request ID
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Order Number
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Issue Type
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Date Created
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {requests.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-850 dark:text-slate-200">
                            <Link to={`/returns/${item.id}`} className="underline text-primary-500">
                              #{item.id.substring(0, 8)}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs font-semibold text-slate-850 dark:text-white">{item.customerName}</div>
                            <div className="text-[10px] text-slate-400">{item.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                            {item.order.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                            {item.issueType.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-650 dark:text-slate-400">
                            {item.assignedTo?.name || (
                              <span className="text-[10px] italic font-semibold text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(item.status)}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                            <Link
                              to={`/returns/${item.id}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-0.5"
                            >
                              Manage <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between pt-4 text-xs font-semibold text-slate-500">
                <span>Showing page {page} of {totalPages} ({totalRequests} records)</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
