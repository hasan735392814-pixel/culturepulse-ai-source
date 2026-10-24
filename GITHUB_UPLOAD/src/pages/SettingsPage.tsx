import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Activity,
  RefreshCw,
  Key,
  Server,
  Shield,
  Database,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { QlooStatus } from '@/lib/types';
import { ENTITY_TYPES } from '@/lib/constants';

interface SettingsPageProps {
  qlooStatus: QlooStatus;
  qlooMessage: string;
  onRefreshStatus: () => void;
}

const STATUS_DETAIL: Record<QlooStatus, { icon: typeof CheckCircle2; color: string; bg: string; title: string }> = {
  connected: { icon: CheckCircle2, color: 'text-teal-accent-400', bg: 'bg-teal-accent-500/10', title: 'Connected' },
  checking: { icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Checking...' },
  'not-configured': { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', title: 'API Key Not Configured' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', title: 'Connection Error' },
  disconnected: { icon: XCircle, color: 'text-midnight-400', bg: 'bg-midnight-800', title: 'Disconnected' },
};

export function SettingsPage({ qlooStatus, qlooMessage, onRefreshStatus }: SettingsPageProps) {
  const [refreshing, setRefreshing] = useState(false);
  const detail = STATUS_DETAIL[qlooStatus];
  const StatusIcon = detail.icon;

  const handleRefresh = () => {
    setRefreshing(true);
    onRefreshStatus();
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-midnight-50 mb-2">Settings</h1>
        <p className="text-midnight-400">Check API status and review the integration configuration.</p>
      </div>

      {/* API Status */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-violet-accent-400" />
          <h2 className="section-title text-lg">Qloo API Status</h2>
        </div>

        <div className={`p-4 rounded-xl ${detail.bg} border border-midnight-700 mb-4`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${detail.color} ${qlooStatus === 'checking' ? 'animate-pulse' : ''}`} />
            <div>
              <p className={`font-medium ${detail.color}`}>{detail.title}</p>
              <p className="text-xs text-midnight-400 mt-0.5">{qlooMessage}</p>
            </div>
          </div>
        </div>

        <button onClick={handleRefresh} className="btn-secondary" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      {/* Security */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-teal-accent-400" />
          <h2 className="section-title text-lg">Security Configuration</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-midnight-950/50">
            <Key className="w-5 h-5 text-midnight-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-midnight-200">API Key Storage</p>
              <p className="text-xs text-midnight-400 mt-1">QLOO_API_KEY is stored as a server-side edge function secret. It is never exposed to the browser, client bundles, or URLs.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-midnight-950/50">
            <Server className="w-5 h-5 text-midnight-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-midnight-200">Server-Side Proxy</p>
              <p className="text-xs text-midnight-400 mt-1">All Qloo API calls go through Supabase Edge Functions. The browser never contacts Qloo directly. The proxy validates inputs, enforces timeouts, and handles errors safely.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-midnight-950/50">
            <Database className="w-5 h-5 text-midnight-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-midnight-200">Data Separation</p>
              <p className="text-xs text-midnight-400 mt-1">Qloo API evidence (real entities, metadata) is always displayed separately from AI-generated interpretations (recommendations, creative directions). Each section is clearly labeled.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Qloo API Details */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-violet-accent-400" />
          <h2 className="section-title text-lg">Qloo API Configuration</h2>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-midnight-800">
            <span className="text-midnight-400">Base URL</span>
            <span className="text-midnight-200 font-mono text-xs">https://hackathon.api.qloo.com</span>
          </div>
          <div className="flex justify-between py-2 border-b border-midnight-800">
            <span className="text-midnight-400">Auth Header</span>
            <span className="text-midnight-200 font-mono text-xs">X-Api-Key</span>
          </div>
          <div className="flex justify-between py-2 border-b border-midnight-800">
            <span className="text-midnight-400">Insights Endpoint</span>
            <span className="text-midnight-200 font-mono text-xs">/v2/insights</span>
          </div>
          <div className="flex justify-between py-2 border-b border-midnight-800">
            <span className="text-midnight-400">Search Endpoint</span>
            <span className="text-midnight-200 font-mono text-xs">/search</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-midnight-400">Supported Entity Types</span>
            <span className="text-midnight-200">{ENTITY_TYPES.length}</span>
          </div>
        </div>

        <a
          href="https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-violet-accent-400 hover:text-violet-accent-300 mt-4"
        >
          View Qloo API Documentation
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* About */}
      <div className="card p-6">
        <h2 className="section-title text-lg mb-3">About CULTUREPULSE AI</h2>
        <p className="text-sm text-midnight-400 leading-relaxed">
          CULTUREPULSE AI is built for the Qloo Agent Hackathon. It uses real Qloo cultural affinity data to help businesses
          understand audience cultural tastes and transform evidence-based insights into relevant product concepts,
          experiences, and marketing campaigns. All cultural entity data comes directly from the Qloo API — no results are fabricated.
        </p>
      </div>
    </div>
  );
}
