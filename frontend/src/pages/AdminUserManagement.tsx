import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Loader, Shield, User } from 'lucide-react';
import api from '../services/api';
import type { User as UserType } from '../types';
import { useToast } from '../context/ToastContext';


export const AdminUserManagement: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data.users || []);
    } catch (e: any) {
      toast.error('Failed to load user catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRoleId: number) => {
    setUpdatingUserId(userId);
    try {
      await api.put(`/users/${userId}/role`, { roleId: newRoleId });
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term))
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">
          Manage Users
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Edit security roles and check support account credentials
        </p>
      </div>

      <div className="p-6 rounded-2xl glass space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white text-xs"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Users className="w-4 h-4" /> Total: {users.length} users
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-8 h-8 text-primary-500 animate-spin mb-2" />
            <p className="text-sm text-slate-500">Loading user database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-slate-500 py-10 text-center">No users found</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-slate-900/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/50">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-slate-850 flex items-center justify-center text-primary-500 shrink-0">
                            {u.role === 'ADMIN' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-850 dark:text-white">{u.name}</div>
                            <div className="text-[10px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        {u.phone || <span className="text-slate-300 italic">None</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400'
                            : u.role === 'SUPPORT_EXECUTIVE'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-2">
                          {updatingUserId === u.id ? (
                            <Loader className="w-4 h-4 animate-spin text-primary-500" />
                          ) : (
                            <select
                              value={u.role === 'ADMIN' ? '1' : u.role === 'SUPPORT_EXECUTIVE' ? '2' : '3'}
                              onChange={(e) => handleRoleChange(u.id, parseInt(e.target.value, 10))}
                              className="px-2.5 py-1 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none dark:text-white text-xs"
                            >
                              <option value="3">Customer</option>
                              <option value="2">Support Executive</option>
                              <option value="1">Admin</option>
                            </select>
                          )}
                        </div>
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
export default AdminUserManagement;
