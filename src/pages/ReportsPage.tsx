import { useState } from 'react';
import {
  FileText,
  Trash2,
  Download,
  Printer,
  ChevronRight,
  Calendar,
  Brain,
  Database,
  GitCompare,
  Palette,
} from 'lucide-react';
import type { SavedReport, AnalysisResult, ConceptComparison, CampaignSuggestions } from '@/lib/types';
import { EmptyState, EvidenceBadge, AIBadge } from '@/components/ui';
import { EntityCard } from '@/components/EntityCard';
import { getEntityName } from '@/lib/qloo-client';

interface ReportsPageProps {
  reports: SavedReport[];
  onDelete: (id: string) => void;
}

function ReportDetail({ report }: { report: SavedReport }) {
  const data = report.data;

  if (report.type === 'analysis') {
    const analysis = data as AnalysisResult;
    return (
      <div className="space-y-4">
        {analysis.interpretation && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-violet-accent-400" />
              <h4 className="font-display font-semibold text-midnight-100 text-sm">AI Interpretation</h4>
              <AIBadge />
            </div>
            <p className="text-xs text-midnight-300 mb-3">{analysis.interpretation.summary}</p>
            {analysis.interpretation.recommendations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-midnight-400 mb-1">Recommendations:</p>
                <ul className="text-xs text-midnight-300 space-y-1">
                  {analysis.interpretation.recommendations.slice(0, 3).map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {analysis.entities.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-teal-accent-400" />
              <h4 className="font-display font-semibold text-midnight-100 text-sm">Qloo Evidence</h4>
              <EvidenceBadge label={`${analysis.entities.length} entities`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.entities.slice(0, 6).map((entity, idx) => (
                <EntityCard key={entity.entity_id || idx} entity={entity} rank={idx + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (report.type === 'comparison') {
    const comp = data as ConceptComparison;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card p-4">
            <h4 className="font-display font-semibold text-midnight-100 text-sm mb-2">{comp.conceptA.name}</h4>
            <p className="text-xs text-midnight-400 mb-2">{comp.resultsA.length} entities</p>
            <div className="space-y-1">
              {comp.resultsA.slice(0, 4).map((e, i) => (
                <p key={i} className="text-xs text-midnight-300">• {getEntityName(e)}</p>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <h4 className="font-display font-semibold text-midnight-100 text-sm mb-2">{comp.conceptB.name}</h4>
            <p className="text-xs text-midnight-400 mb-2">{comp.resultsB.length} entities</p>
            <div className="space-y-1">
              {comp.resultsB.slice(0, 4).map((e, i) => (
                <p key={i} className="text-xs text-midnight-300">• {getEntityName(e)}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-violet-accent-400" />
            <h4 className="font-display font-semibold text-midnight-100 text-sm">Key Differences</h4>
            <AIBadge />
          </div>
          <ul className="text-xs text-midnight-300 space-y-1">
            {comp.differences.slice(0, 3).map((d, i) => <li key={i}>• {d}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  const campaign = data as CampaignSuggestions;
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-violet-accent-400" />
        <h4 className="font-display font-semibold text-midnight-100 text-sm">Campaign Suggestions</h4>
        <AIBadge />
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-midnight-400 mb-1">Themes:</p>
          <ul className="text-xs text-midnight-300 space-y-1">
            {campaign.themes.slice(0, 3).map((t, i) => <li key={i}>• {t}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-midnight-400 mb-1">Creative Direction:</p>
          <ul className="text-xs text-midnight-300 space-y-1">
            {campaign.creativeDirection.slice(0, 3).map((c, i) => <li key={i}>• {c}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function reportTypeIcon(type: SavedReport['type']) {
  switch (type) {
    case 'analysis': return Brain;
    case 'comparison': return GitCompare;
    case 'campaign': return Palette;
  }
}

function reportTypeLabel(type: SavedReport['type']) {
  switch (type) {
    case 'analysis': return 'Analysis';
    case 'comparison': return 'Comparison';
    case 'campaign': return 'Campaign';
  }
}

function exportReport(report: SavedReport) {
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `culturepulse-${report.type}-${report.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage({ reports, onDelete }: ReportsPageProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-midnight-50 mb-2">Saved Reports</h1>
        <p className="text-midnight-400">Session-stored reports. Reports are saved in your browser and will be lost when you clear browser data.</p>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No saved reports yet"
          description="Run a cultural analysis, compare concepts, or generate campaign suggestions — then save the results to view them here."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const Icon = reportTypeIcon(report.type);
            const isExpanded = expandedId === report.id;
            return (
              <div key={report.id} className="card overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-midnight-800/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-accent-600/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-violet-accent-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-midnight-100 text-sm truncate">{report.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="badge badge-neutral text-[10px]">{reportTypeLabel(report.type)}</span>
                      <span className="text-xs text-midnight-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => exportReport(report)} className="btn-ghost p-2" title="Export as JSON">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => window.print()} className="btn-ghost p-2" title="Print">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { onDelete(report.id); if (isExpanded) setExpandedId(null); }}
                      className="btn-ghost p-2 text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-midnight-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
                {isExpanded && (
                  <div className="p-4 border-t border-midnight-800 animate-slide-in">
                    <ReportDetail report={report} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
