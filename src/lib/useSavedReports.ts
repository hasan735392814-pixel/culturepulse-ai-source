import { useState, useEffect, useCallback } from 'react';
import type { SavedReport } from '@/lib/types';

const STORAGE_KEY = 'culturepulse_reports';

export function useSavedReports() {
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setReports(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveReport = useCallback((report: Omit<SavedReport, 'id' | 'createdAt'>) => {
    const newReport: SavedReport = {
      ...report,
      id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => {
      const updated = [newReport, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    return newReport;
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  return { reports, saveReport, deleteReport };
}
