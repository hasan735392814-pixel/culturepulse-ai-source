import {
  Brain,
  Sparkles,
  GitCompare,
  Palette,
  FileText,
  ArrowRight,
  Activity,
  TrendingUp,
  Target,
  Lightbulb,
} from 'lucide-react';
import type { PageId } from '@/lib/constants';
import type { QlooStatus } from '@/lib/types';
import { ENTITY_TYPES } from '@/lib/constants';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
  qlooStatus: QlooStatus;
  qlooMessage: string;
  reportCount: number;
}

const FEATURES = [
  {
    id: 'analysis' as PageId,
    icon: Sparkles,
    title: 'Cultural Intelligence Agent',
    desc: 'Enter a business brief and get real Qloo-backed cultural affinities, entities, and opportunities.',
    badge: 'Core Feature',
  },
  {
    id: 'compare' as PageId,
    icon: GitCompare,
    title: 'Culture Concept Comparator',
    desc: 'Compare two campaign or product concepts side-by-side using real Qloo evidence for each.',
    badge: 'Compare',
  },
  {
    id: 'studio' as PageId,
    icon: Palette,
    title: 'Campaign Studio',
    desc: 'Transform evidence-backed insights into campaign themes, creative direction, and engagement ideas.',
    badge: 'Create',
  },
];

export function Dashboard({ onNavigate, qlooStatus, qlooMessage, reportCount }: DashboardProps) {
  const isConnected = qlooStatus === 'connected';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden card p-8 lg:p-12 grid-bg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-accent-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-accent-600/10 rounded-full blur-3xl translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <span className={`badge ${isConnected ? 'badge-teal' : 'badge-warn'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-teal-accent-400' : 'bg-amber-400'}`} />
              {isConnected ? 'Qloo API Connected' : 'Qloo API Not Connected'}
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-midnight-50 mb-3 leading-tight">
            Cultural Intelligence<br />
            <span className="bg-gradient-to-r from-violet-accent-400 to-teal-accent-400 bg-clip-text text-transparent">
              for the Real World
            </span>
          </h1>
          <p className="text-midnight-300 text-base lg:text-lg max-w-2xl mb-6 leading-relaxed">
            CULTUREPULSE AI transforms real Qloo cultural affinity data into actionable business insights.
            Discover what your audience loves, compare concepts, and build campaigns grounded in evidence.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onNavigate('analysis')} className="btn-primary" disabled={!isConnected}>
              <Sparkles className="w-4 h-4" />
              Start New Analysis
            </button>
            <button onClick={() => onNavigate('compare')} className="btn-secondary" disabled={!isConnected}>
              <GitCompare className="w-4 h-4" />
              Compare Concepts
            </button>
          </div>
          {!isConnected && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-2xl">
              <p className="text-sm text-amber-300">
                Qloo API is not connected. Visit Settings to check the API status. Analysis features require a valid Qloo API key configured on the server.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-accent-600/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-violet-accent-400" />
            </div>
            <span className="text-sm text-midnight-400">API Status</span>
          </div>
          <p className="text-lg font-display font-semibold text-midnight-100">
            {isConnected ? 'Connected' : qlooStatus === 'not-configured' ? 'Not Configured' : 'Error'}
          </p>
          <p className="text-xs text-midnight-500 mt-1 truncate">{qlooMessage}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-accent-600/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-accent-400" />
            </div>
            <span className="text-sm text-midnight-400">Saved Reports</span>
          </div>
          <p className="text-lg font-display font-semibold text-midnight-100">{reportCount}</p>
          <p className="text-xs text-midnight-500 mt-1">Session-stored reports</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-midnight-700 flex items-center justify-center">
              <Target className="w-5 h-5 text-midnight-300" />
            </div>
            <span className="text-sm text-midnight-400">Entity Types</span>
          </div>
          <p className="text-lg font-display font-semibold text-midnight-100">{ENTITY_TYPES.length}</p>
          <p className="text-xs text-midnight-500 mt-1">Cultural domains via Qloo</p>
        </div>
      </div>

      <div>
        <h2 className="section-title text-xl mb-4">Signature Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => onNavigate(feature.id)}
                disabled={!isConnected && feature.id !== 'studio'}
                className="card card-hover p-6 text-left disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-accent-600/20 to-teal-accent-600/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-violet-accent-400" />
                  </div>
                  <span className="badge badge-neutral">{feature.badge}</span>
                </div>
                <h3 className="font-display font-semibold text-midnight-50 mb-2">{feature.title}</h3>
                <p className="text-sm text-midnight-400 leading-relaxed mb-4">{feature.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm text-violet-accent-400 group-hover:gap-2 transition-all">
                  Open <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-accent-400" />
          <h2 className="section-title text-lg">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Enter Brief', desc: 'Business category, audience, location, and cultural interests' },
            { step: '2', title: 'Qloo Query', desc: 'Server searches Qloo entities and retrieves affinity insights' },
            { step: '3', title: 'Interpret', desc: 'Evidence is separated from AI-generated recommendations' },
            { step: '4', title: 'Act', desc: 'Explore evidence, compare concepts, and build campaigns' },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="w-8 h-8 rounded-lg bg-violet-accent-600/15 text-violet-accent-400 font-display font-bold text-sm flex items-center justify-center mb-3">
                {item.step}
              </div>
              <h3 className="font-medium text-midnight-100 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-midnight-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h2 className="section-title text-lg">Supported Cultural Domains</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {ENTITY_TYPES.map((type) => (
            <span key={type.value} className="badge badge-neutral">
              {type.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
