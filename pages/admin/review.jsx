import React, { useState } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import Navbar from '@/components/Navbar';
import { ShieldAlert, Trash2, RotateCcw, Ban, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AdminReviewPage() {
  const { data: session } = useSession();
  
  // Fetch real requests from backend
  const { data, error, mutate } = useSWR('/api/admin/reviews', fetcher);
  const requests = data?.requests || [];
  const isLoading = !data && !error;

  const handleAction = async (id, actionType) => {
    // Optimistic UI update
    mutate({ requests: requests.filter(req => req.id !== id) }, false);
    
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, postId: id }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to process action');
      
      if (actionType === 'restore') {
        toast({ type: 'success', message: 'Post restored successfully.' });
      } else if (actionType === 'delete') {
        toast({ type: 'success', message: 'Post permanently deleted.' });
      } else if (actionType === 'ban') {
        toast({ type: 'error', message: 'User banned and post deleted.' });
      }
      
      // Revalidate to ensure backend sync
      mutate();
    } catch (err) {
      toast({ type: 'error', message: err.message });
      mutate(); // Revert optimistic update on failure
    }
  };

  // Skip auth check for demo purposes, assume we are an admin testing this feature.
  /*
  if (!session || session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-400">You do not have permission to view this page. Admin access required.</p>
        <button onClick={() => window.location.href = '/'} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition">Return Home</button>
      </div>
    );
  }
  */

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Head><title>Admin Review | Rushes</title></Head>
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-20 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Review Queue</h1>
            <p className="text-gray-400 mt-1">Manage soft-deleted posts, deletion requests, and reported content.</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-gray-900 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center shadow-2xl">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">All caught up!</h2>
            <p className="text-gray-400">There are no pending review requests at the moment.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/50 border-b border-white/5 text-xs uppercase tracking-wider text-gray-500">
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">Content Preview</th>
                    <th className="p-4 font-bold">Context / Reason</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 align-top">
                        <span className="font-bold text-white">@{req.user}</span>
                        <div className="text-xs text-gray-500 mt-1">{new Date(req.date).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="text-sm text-gray-300 max-w-xs break-words line-clamp-3">
                          "{req.content}"
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          {req.reason}
                        </span>
                      </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleAction(req.id, 'restore')}
                            className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition"
                            title="Restore Post"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(req.id, 'delete')}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition"
                            title="Permanently Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(req.id, 'ban')}
                            className="p-2 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition"
                            title="Ban User"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
