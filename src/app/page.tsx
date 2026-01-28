'use client';

import { useState, useCallback } from 'react';
import AnalyzeForm from '../components/AnalyzeForm';
import ProgressSteps, { Step, StepStatus } from '../components/ProgressSteps';
import CompetitorsList, { CompetitorInfo } from '../components/CompetitorsList';
import ReportViewer from '../components/ReportViewer';

const INITIAL_STEPS: Step[] = [
  { id: 'scraping', label: 'Scraping target website', status: 'pending' },
  { id: 'profile', label: 'Extracting business profile', status: 'pending' },
  { id: 'identifying', label: 'Identifying competitors', status: 'pending' },
  { id: 'scraping_competitors', label: 'Scraping competitor websites', status: 'pending' },
  { id: 'analyzing', label: 'Analyzing competitors', status: 'pending' },
  { id: 'market', label: 'Generating analysis', status: 'pending' },
  { id: 'report', label: 'Creating report', status: 'pending' },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [competitors, setCompetitors] = useState<CompetitorInfo[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStep = useCallback((stepId: string, status: StepStatus, label?: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? { ...step, status, label: label || step.label }
          : step
      )
    );
  }, []);

  const handleAnalyze = useCallback(async (url: string, competitorCount: number) => {
    setIsLoading(true);
    setSteps(INITIAL_STEPS);
    setCompetitors([]);
    setReport(null);
    setCompanyName(null);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, competitors: competitorCount }),
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            switch (currentEvent) {
              case 'progress':
                updateStep(data.step, data.status);
                break;
              case 'profile':
                setCompanyName(data.companyName);
                break;
              case 'competitors':
                setCompetitors(data);
                break;
              case 'complete':
                setReport(data.report);
                setCompanyName(data.companyName);
                break;
              case 'error':
                setError(data.message);
                break;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [updateStep]);

  const hasStarted = steps.some((s) => s.status !== 'pending');

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Competitive Research</h1>
          <p className="mt-2 text-gray-600">
            AI-powered competitive analysis for any company
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <AnalyzeForm onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Progress */}
        {hasStarted && !report && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ProgressSteps steps={steps} />
          </div>
        )}

        {/* Competitors */}
        {competitors.length > 0 && !report && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <CompetitorsList competitors={competitors} />
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ReportViewer content={report} companyName={companyName || undefined} />
          </div>
        )}
      </div>
    </main>
  );
}
