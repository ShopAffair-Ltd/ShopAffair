import React, { useEffect, useState } from 'react';
import { fetchAuditLogs, AuditLogEntry } from '../../services/adminService';

export const ActivityLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs().then((r) => setLogs(r.items)).catch(() => setLogs([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Activity Logs</h3>
        <span className="text-[10px] text-slate-400">{logs.length} entries</span>
      </div>
      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No activity recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px]">
              <div className="flex justify-between">
                <strong className="text-white">{log.action}</strong>
                <span className="text-slate-500 font-mono text-[9px]">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-slate-400 mt-1">{log.details}</p>
              <p className="text-slate-500 font-mono text-[9px] mt-0.5">
                by @{log.actor?.username ?? 'system'}{log.targetUser ? ` → @${log.targetUser.username}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};