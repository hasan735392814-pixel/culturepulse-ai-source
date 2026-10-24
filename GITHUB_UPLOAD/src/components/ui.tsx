import { AlertCircle, RefreshCw, Search, FolderOpen } from 'lucide-react';

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-midnight-700" />
        <div className="absolute inset-0 rounded-full border-2 border-violet-accent-500 border-t-transparent animate-spin" />
      </div>
      {label && <p className="text-sm text-midnight-400">{label}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card p-8 flex flex-col items-center text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="font-display font-semibold text-midnight-100 mb-2">Something went wrong</h3>
      <p className="text-sm text-midnight-400 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
}: {
  icon?: 'search' | 'folder';
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const Icon = icon === 'folder' ? FolderOpen : Search;
  return (
    <div className="card p-12 flex flex-col items-center text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-midnight-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-midnight-500" />
      </div>
      <h3 className="font-display font-semibold text-midnight-100 text-lg mb-2">{title}</h3>
      <p className="text-sm text-midnight-400 max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}

export function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-violet-accent-400">{icon}</span>}
      <h2 className="section-title text-lg">{children}</h2>
    </div>
  );
}

export function InsightList({ items, variant = 'default' }: { items: string[]; variant?: 'default' | 'creative' | 'warning' }) {
  const colors = {
    default: 'border-violet-accent-500/20 bg-violet-accent-500/5',
    creative: 'border-teal-accent-500/20 bg-teal-accent-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
  };
  const dotColors = {
    default: 'bg-violet-accent-400',
    creative: 'bg-teal-accent-400',
    warning: 'bg-amber-400',
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`flex gap-3 p-3 rounded-xl border ${colors[variant]} animate-slide-in`}
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <div className={`w-2 h-2 rounded-full ${dotColors[variant]} mt-1.5 flex-shrink-0`} />
          <p className="text-sm text-midnight-200 leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  );
}

export function EvidenceBadge({ label }: { label: string }) {
  return (
    <span className="badge badge-teal">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-accent-400" />
      {label}
    </span>
  );
}

export function AIBadge({ label }: { label?: string }) {
  return (
    <span className="badge badge-violet">
      <span className="w-1.5 h-1.5 rounded-full bg-violet-accent-400" />
      {label || 'AI Interpretation'}
    </span>
  );
}
