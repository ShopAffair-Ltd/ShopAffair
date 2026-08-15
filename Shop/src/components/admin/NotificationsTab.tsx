import React, { useState } from 'react';
import { broadcastAlert } from '../../services/settingsService';

export const NotificationsTab: React.FC = () => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleBroadcast = async () => {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await broadcastAlert(message.trim());
      setResult(`Sent to ${res.recipientCount} user(s).`);
      setMessage('');
    } catch {
      setResult('Could not send broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Broadcast Platform Notification</h3>
      </div>

      <div className="space-y-3 text-xs">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Message to send to every active user..."
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-purple-500 resize-none"
        />
        {result && <p className="text-[10px] text-slate-400">{result}</p>}
        <button
          onClick={handleBroadcast}
          disabled={sending}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-[10px] rounded cursor-pointer"
        >
          {sending ? 'Sending...' : 'Broadcast'}
        </button>
      </div>
    </div>
  );
};