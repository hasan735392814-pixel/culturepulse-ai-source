import { useState, useCallback } from 'react';
import { Sidebar, MobileTopBar } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { ComparePage } from '@/pages/ComparePage';
import { StudioPage } from '@/pages/StudioPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useQlooStatus } from '@/lib/useQlooStatus';
import { useSavedReports } from '@/lib/useSavedReports';
import type { PageId } from '@/lib/constants';
import type { AnalysisResult, ConceptComparison, CampaignSuggestions } from '@/lib/types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);

  const { status: qlooStatus, message: qlooMessage, check: recheckStatus } = useQlooStatus();
  const { reports, saveReport, deleteReport } = useSavedReports();

  const handleNavigate = useCallback((page: PageId) => {
    setCurrentPage(page);
  }, []);

  const handleSaveAnalysis = useCallback((title: string, _type: 'analysis', data: AnalysisResult) => {
    saveReport({ title, type: 'analysis', data });
    setLastAnalysis(data);
  }, [saveReport]);

  const handleSaveComparison = useCallback((title: string, _type: 'comparison', data: ConceptComparison) => {
    saveReport({ title, type: 'comparison', data });
  }, [saveReport]);

  const handleSaveCampaign = useCallback((title: string, _type: 'campaign', data: CampaignSuggestions) => {
    saveReport({ title, type: 'campaign', data });
  }, [saveReport]);

  return (
    <div className="min-h-screen flex bg-midnight-950">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        qlooStatus={qlooStatus}
        qlooMessage={qlooMessage}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopBar onOpenMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              qlooStatus={qlooStatus}
              qlooMessage={qlooMessage}
              reportCount={reports.length}
            />
          )}

          {currentPage === 'analysis' && (
            <AnalysisPage
              qlooStatus={qlooStatus}
              onSaveReport={handleSaveAnalysis}
            />
          )}

          {currentPage === 'compare' && (
            <ComparePage
              qlooStatus={qlooStatus}
              onSaveReport={handleSaveComparison}
            />
          )}

          {currentPage === 'studio' && (
            <StudioPage
              qlooStatus={qlooStatus}
              onSaveReport={handleSaveCampaign}
              lastAnalysis={lastAnalysis}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsPage
              reports={reports}
              onDelete={deleteReport}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              qlooStatus={qlooStatus}
              qlooMessage={qlooMessage}
              onRefreshStatus={recheckStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
