import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  User,
  Shield,
  MessageSquare,
  AlertTriangle,
  Clock,
  Loader,
  Send,
  Lock,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';
import type { ReturnRequest, Comment, User as UserType } from '../types';
import { useAuth } from '../context/AuthContext';

import { useToast } from '../context/ToastContext';

export const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [supportStaff, setSupportStaff] = useState<UserType[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [isInternalComment, setIsInternalComment] = useState<boolean>(false);
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);

  // Status update form states
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Assignee state
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const fetchRequestDetails = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/returns/${id}`);
      const data = res.data.data.returnRequest;
      setRequest(data);
      setNewStatus(data.status);
      setAssignedToId(data.assignedToId || '');
      
      // Comments are loaded in returnRequest, but let's sync comment state
      setComments(data.comments || []);
    } catch (e: any) {
      toast.error('Failed to load request details.');
      navigate(user?.role === 'CUSTOMER' ? '/dashboard' : '/admin');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupportStaff = async () => {
    if (user?.role === 'CUSTOMER') return;
    try {
      const res = await api.get('/users');
      const allUsers: UserType[] = res.data.data.users || [];
      const supportUsers = allUsers.filter(u => u.role === 'SUPPORT_EXECUTIVE' || u.role === 'ADMIN');
      setSupportStaff(supportUsers);
    } catch (e) {
      console.error('Failed to fetch support staff list', e);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
    fetchSupportStaff();
  }, [id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsPostingComment(true);
    try {
      const res = await api.post(`/returns/${id}/comments`, {
        commentText: commentText.trim(),
        isInternal: isInternalComment,
      });
      setComments((prev) => [...prev, res.data.data.comment]);
      setCommentText('');
      setIsInternalComment(false);
      toast.success('Comment posted');
    } catch (err: any) {
      toast.error('Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;

    setIsUpdatingStatus(true);
    try {
      await api.put(`/returns/${id}`, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });
      toast.success('Request status updated successfully!');
      setStatusNote('');
      fetchRequestDetails(); // refresh status timeline
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignExecutive = async (val: string) => {
    setAssignedToId(val);
    setIsAssigning(true);
    try {
      await api.put(`/returns/${id}`, {
        assignedToId: val || null,
        note: `Assigned request to ${val ? supportStaff.find(s => s.id === val)?.name : 'Unassigned'}.`,
      });
      toast.success('Assignee updated successfully!');
      fetchRequestDetails();
    } catch (err: any) {
      toast.error('Failed to assign request.');
    } finally {
      setIsAssigning(false);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader className="w-10 h-10 text-primary-500 animate-spin mb-2" />
        <p className="text-sm text-slate-500">Loading details...</p>
      </div>
    );
  }

  if (!request) return null;

  const isAdminOrSupport = user?.role === 'ADMIN' || user?.role === 'SUPPORT_EXECUTIVE';

  return (
    <div className="space-y-8">
      {/* Header Back Button */}
      <Link
        to={user?.role === 'CUSTOMER' ? '/dashboard' : '/admin/returns'}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to List
      </Link>

      {/* Main Request Summary Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Details & Images */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl glass space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
              <div>
                <span className="text-xs font-bold text-primary-500">REQUEST DETAILS</span>
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                  Request #{request.id.substring(0, 8)}
                </h1>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(request.status)}`}>
                {request.status.replace('_', ' ')}
              </span>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <User className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="truncate"><strong>Name:</strong> {request.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Mail className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="truncate"><strong>Email:</strong> {request.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Phone className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="truncate"><strong>Phone:</strong> {request.phone}</span>
              </div>
            </div>

            {/* Request Specifics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold">Order Number</span>
                <p className="font-semibold text-slate-800 dark:text-white">{request.order.orderNumber}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold">Issue Type</span>
                <p className="font-semibold text-slate-800 dark:text-white">{request.issueType.replace('_', ' ')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold">Preferred Resolution</span>
                <p className="font-semibold text-slate-800 dark:text-white">{request.preferredResolution}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 uppercase font-semibold">Purchase Date</span>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {new Date(request.order.purchaseDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
              <span className="text-xs text-slate-400 uppercase font-semibold">Problem Description</span>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/30 dark:bg-slate-900/10 p-3 rounded-lg border border-slate-200/30 dark:border-slate-800/20">
                {request.issueDescription}
              </p>
            </div>

            {/* Order Items returned */}
            <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 space-y-3">
              <span className="text-xs text-slate-400 uppercase font-semibold block">Items on Order</span>
              <div className="space-y-2">
                {request.order.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-100/40 dark:bg-slate-900/40 p-3 rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      {item.product.imageUrl && (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-10 h-10 object-cover rounded-md" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{item.product.name}</p>
                        <p className="text-xs text-slate-400">SKU: {item.product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800 dark:text-white">${item.price}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Images Gallery */}
            {request.images.length > 0 && (
              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 space-y-3">
                <span className="text-xs text-slate-400 uppercase font-semibold block">Uploaded Evidence (Images)</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {request.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.imageUrl.startsWith('/uploads') ? `http://localhost:5000${img.imageUrl}` : img.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <img src={img.imageUrl.startsWith('/uploads') ? `http://localhost:5000${img.imageUrl}` : img.imageUrl} alt="Return Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comment Threads */}
          <div className="p-6 rounded-2xl glass space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              Communication History
            </h3>

            {/* Render comments list */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {comments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No comments posted yet.</p>
              ) : (
                comments.map((comment) => {
                  const isInternal = comment.isInternal;
                  const isAuthorAgent = comment.user.role !== 'CUSTOMER';
                  return (
                    <div
                      key={comment.id}
                      className={`flex flex-col max-w-[85%] p-3.5 rounded-2xl text-sm ${
                        isInternal
                          ? 'bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/30 dark:border-rose-900/20 mr-auto'
                          : isAuthorAgent
                          ? 'bg-primary-50/60 dark:bg-primary-950/20 border border-primary-200/30 dark:border-primary-900/20 mr-auto'
                          : 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 ml-auto'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                          {comment.user.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {comment.user.role.replace('_', ' ')}
                        </span>
                        {isInternal && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-100/80 px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-1">
                            <Lock className="w-2.5 h-2.5" /> INTERNAL NOTE
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{comment.commentText}</p>
                      <span className="text-[9px] text-slate-400 text-right mt-1.5">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment form */}
            <form onSubmit={handlePostComment} className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 space-y-4">
              <div className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  placeholder="Type a message or note..."
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all text-sm resize-none"
                />
                <button
                  type="submit"
                  disabled={isPostingComment || !commentText.trim()}
                  className="absolute right-2.5 bottom-3.5 p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {isPostingComment ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              {/* Show internal check for admins */}
              {isAdminOrSupport && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isInternal"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <label htmlFor="isInternal" className="text-xs font-semibold text-rose-500 flex items-center gap-1 cursor-pointer">
                    <Lock className="w-3 h-3" /> Mark as Internal Support Note (Customer won't see this)
                  </label>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right column: Status History Timeline & Staff Action */}
        <div className="space-y-6">
          
          {/* Executive actions panel */}
          {isAdminOrSupport && (
            <div className="p-6 rounded-2xl glass space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Staff Controls
              </h3>

              {/* Assign Support Staff */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Assign Executive
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => handleAssignExecutive(e.target.value)}
                  disabled={isAssigning}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all text-sm"
                >
                  <option value="">Unassigned</option>
                  {supportStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Update Status form */}
              <form onSubmit={handleUpdateStatus} className="space-y-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Change Request Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all text-sm"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="REPLACEMENT_INITIATED">Replacement Initiated</option>
                    <option value="REPLACEMENT_SHIPPED">Replacement Shipped</option>
                    <option value="REFUND_INITIATED">Refund Initiated</option>
                    <option value="REFUND_COMPLETED">Refund Completed</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status Update Note</label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={3}
                    placeholder="Provide a rationale for this status update..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-all text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingStatus || (newStatus === request.status && !statusNote.trim())}
                  className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all shadow shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingStatus ? <Loader className="w-4 h-4 animate-spin" /> : 'Save Update'}
                </button>
              </form>
            </div>
          )}

          {/* Status Timeline */}
          <div className="p-6 rounded-2xl glass space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Tracking Timeline
            </h3>

            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
              {request.statusHistory?.map((history, idx) => (
                <div key={history.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-primary-500"></div>
                  
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded">
                      {history.status.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(history.createdAt).toLocaleString()} by {history.createdBy.name}
                    </p>
                    {history.note && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded border border-slate-200/30 dark:border-slate-800/10 mt-2">
                        {history.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RequestDetail;
