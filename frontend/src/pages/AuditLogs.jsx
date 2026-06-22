import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetAuditLogs } from '../features/analyticsAndOthersApi';
import { ShieldCheck, Calendar, Globe, Monitor, Loader2, ArrowLeftRight } from 'lucide-react';

const AuditLogs = () => {
  const params = useParams();
  const { workspaceId } = params;

  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useGetAuditLogs({
    workspaceId,
    action: actionFilter,
    page,
    limit: 15
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Security Audit Logs</h1>
          <p className="text-sm text-slate-400 mt-1">Review the historical log trail of critical user actions in this workspace.</p>
        </div>

        {/* Action filter select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Action Type:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
          >
            <option value="" className="bg-[#12101a]">All Actions</option>
            <option value="auth.login" className="bg-[#12101a]">User Login</option>
            <option value="workspace.create" className="bg-[#12101a]">Workspace Create</option>
            <option value="board.create" className="bg-[#12101a]">Board Create</option>
            <option value="column.create" className="bg-[#12101a]">Column Create</option>
            <option value="card.create" className="bg-[#12101a]">Card Create</option>
            <option value="card.move" className="bg-[#12101a]">Card Moved</option>
            <option value="timer.start" className="bg-[#12101a]">Timer Started</option>
            <option value="timer.stop" className="bg-[#12101a]">Timer Stopped</option>
            <option value="comment.add" className="bg-[#12101a]">Comment Added</option>
            <option value="webhook.create" className="bg-[#12101a]">Webhook Add</option>
          </select>
        </div>
      </div>

      {/* Logs Table listing */}
      <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-slate-500 font-semibold uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Resource Info</th>
                <th className="p-4">Network IP / Agent</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actionBadgeColor = {
                  'auth.login': 'text-emerald-400 bg-emerald-400/10',
                  'card.move': 'text-indigo-400 bg-indigo-400/10',
                  'card.create': 'text-violet-400 bg-violet-400/10',
                  'timer.start': 'text-amber-400 bg-amber-400/10',
                  'timer.stop': 'text-red-400 bg-red-400/10'
                }[log.action] || 'text-slate-400 bg-slate-400/10';

                return (
                  <tr key={log._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-violet-500/20 text-violet-300 font-bold uppercase text-[9px] flex items-center justify-center">
                          {log.userId?.name ? log.userId.name[0] : 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{log.userId?.name || 'System'}</p>
                          <p className="text-[9px] text-slate-500">{log.userId?.email || 'automated@flowdesk.io'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-medium ${actionBadgeColor}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 text-slate-300">
                      <div className="max-w-xs truncate">
                        {log.action === 'card.move' && (
                          <span className="flex items-center gap-1.5">
                            <ArrowLeftRight size={12} className="text-slate-500" />
                            Card ID: {log.details.cardId?.substr(-6)}
                          </span>
                        )}
                        {log.action === 'card.create' && `Created card "${log.details.title}"`}
                        {log.action === 'timer.stop' && `Logged ${log.details.duration} seconds`}
                        {!log.details.title && !log.details.duration && !log.details.cardId && '-'}
                      </div>
                    </td>

                    <td className="p-4 space-y-1 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Globe size={11} />
                        <span>{log.ipAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5 max-w-[150px] truncate" title={log.userAgent}>
                        <Monitor size={11} />
                        <span>{log.userAgent}</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-600" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                    No security audit logs found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination buttons */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5 bg-white/[0.01]">
            <span className="text-[10px] text-slate-500 font-medium">Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="glass-button-secondary py-1 px-3 text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage(p => p + 1)}
                className="glass-button-secondary py-1 px-3 text-xs disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
