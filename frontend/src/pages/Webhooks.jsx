import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetWebhooksQuery, useCreateWebhookMutation, useDeleteWebhookMutation } from '../features/analyticsAndOthersApi';
import { Webhook, Plus, Trash2, Mail, ShieldAlert, Loader2 } from 'lucide-react';

const Webhooks = () => {
  const params = useParams();
  const { workspaceId } = params;

  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data, isLoading, refetch } = useGetWebhooksQuery(workspaceId);
  const webhooks = data?.webhooks || [];

  const [createWebhook, { isLoading: creating }] = useCreateWebhookMutation();
  const [deleteWebhook] = useDeleteWebhookMutation();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setErrorMsg('Webhook URL must begin with http:// or https://');
      return;
    }

    if (secret.length < 8) {
      setErrorMsg('Signing Secret must be at least 8 characters long');
      return;
    }

    try {
      await createWebhook({
        workspaceId,
        url,
        secret,
        events: ['card.done']
      }).unwrap();
      setUrl('');
      setSecret('');
      refetch();
    } catch (err) {
      setErrorMsg(err.data?.message || 'Failed to register webhook.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this webhook configuration?')) return;
    try {
      await deleteWebhook(id).unwrap();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

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
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Webhook Subscriptions</h1>
        <p className="text-sm text-slate-400 mt-1">Configure Webhook payloads triggers when card tasks transition to the "Done" columns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Span 1): Register Form */}
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Webhook size={16} className="text-indigo-400" />
              Subscribe Webhook
            </h3>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5 font-sans">Payload Destination URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://api.yourdomain.com/webhooks"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5 font-sans">HMAC SHA-256 Signing Secret</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full glass-button-primary py-2 text-xs"
              >
                <Plus size={14} />
                {creating ? 'Registering...' : 'Register Webhook'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (Span 2): Active webhook list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="font-bold text-sm text-white border-b border-white/5 pb-3">
              Registered Webhooks ({webhooks.length})
            </h3>

            <div className="space-y-4">
              {webhooks.map((hook) => (
                <div key={hook._id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-indigo-400 truncate">{hook.url}</p>
                    <div className="flex gap-3 text-[9px] text-slate-500 font-medium mt-1 uppercase tracking-wider">
                      <span>Trigger: Card Completed</span>
                      <span>&bull;</span>
                      <span>Active: {hook.isActive ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(hook._id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                    title="Delete Webhook"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {webhooks.length === 0 && (
                <p className="text-xs text-slate-600 italic">No webhooks registered for this workspace yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Webhooks;
