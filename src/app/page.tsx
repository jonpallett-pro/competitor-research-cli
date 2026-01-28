'use client';

import { useState, useCallback } from 'react';
import AnalyzeForm from '../components/AnalyzeForm';
import ProgressSteps, { Step, StepStatus } from '../components/ProgressSteps';
import ReportViewer from '../components/ReportViewer';

interface Competitor {
  name: string;
  url: string;
  description: string;
  relevanceScore: number;
  reasoning: string;
  approved: boolean;
}

interface TargetProfile {
  companyName: string;
  industry: string;
  description: string;
  valueProposition: string;
  targetAudience: string;
  keyFeatures: string[];
  pricingModel?: string;
  techStack?: string[];
}

type AnalysisPhase = 'idle' | 'identifying' | 'validating' | 'analyzing' | 'complete';

const INITIAL_STEPS: Step[] = [
  { id: 'scraping', label: 'Scraping target website', status: 'pending' },
  { id: 'profile', label: 'Extracting business profile', status: 'pending' },
  { id: 'identifying', label: 'Identifying competitors', status: 'pending' },
];

const ANALYSIS_STEPS: Step[] = [
  { id: 'scraping_competitors', label: 'Scraping competitor websites', status: 'pending' },
  { id: 'analyzing', label: 'Analyzing competitors', status: 'pending' },
  { id: 'market', label: 'Generating analysis', status: 'pending' },
  { id: 'report', label: 'Creating report', status: 'pending' },
];

export default function Home() {
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [targetProfile, setTargetProfile] = useState<TargetProfile | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replacingCompetitors, setReplacingCompetitors] = useState(false);

  const updateStep = useCallback((stepId: string, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status } : step
      )
    );
  }, []);

  // Phase 1: Start analysis - scrape, profile, identify competitors
  const handleStartAnalysis = useCallback(async (url: string, competitorCount: number) => {
    setIsLoading(true);
    setPhase('identifying');
    setSteps(INITIAL_STEPS);
    setCompetitors([]);
    setReport(null);
    setCompanyName(null);
    setError(null);
    setTargetUrl(url);

    updateStep('scraping', 'in_progress');

    try {
      const response = await fetch('/api/analyze/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, competitors: competitorCount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      updateStep('scraping', 'complete');
      updateStep('profile', 'complete');
      updateStep('identifying', 'complete');

      setTargetProfile(data.targetProfile);
      setCompanyName(data.targetProfile.companyName);
      setCompetitors(data.competitors);
      setPhase('validating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPhase('idle');
    } finally {
      setIsLoading(false);
    }
  }, [updateStep]);

  // Toggle competitor approval
  const toggleCompetitor = useCallback((index: number) => {
    setCompetitors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, approved: !c.approved } : c))
    );
  }, []);

  // Replace rejected competitors
  const handleReplaceCompetitors = useCallback(async () => {
    if (!targetProfile) return;

    const rejectedNames = competitors.filter((c) => !c.approved).map((c) => c.name);
    const approvedCompetitors = competitors.filter((c) => c.approved);
    const neededCount = competitors.length - approvedCompetitors.length;

    if (neededCount === 0) return;

    setReplacingCompetitors(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetProfile,
          excludeNames: [...rejectedNames, ...approvedCompetitors.map((c) => c.name)],
          count: neededCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find replacements');
      }

      setCompetitors([...approvedCompetitors, ...data.competitors]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace competitors');
    } finally {
      setReplacingCompetitors(false);
    }
  }, [competitors, targetProfile]);

  // Phase 2: Continue with approved competitors
  const handleContinueAnalysis = useCallback(async () => {
    const approvedCompetitors = competitors.filter((c) => c.approved);

    if (approvedCompetitors.length === 0) {
      setError('Please approve at least one competitor');
      return;
    }

    setIsLoading(true);
    setPhase('analyzing');
    setSteps(ANALYSIS_STEPS);
    setError(null);

    try {
      const response = await fetch('/api/analyze/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          targetProfile,
          competitors: approvedCompetitors,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to continue analysis');
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
              case 'complete':
                setReport(data.report);
                setCompanyName(data.companyName);
                setPhase('complete');
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
  }, [competitors, targetUrl, targetProfile, updateStep]);

  const hasStarted = phase !== 'idle';
  const allApproved = competitors.every((c) => c.approved);
  const someRejected = competitors.some((c) => !c.approved);

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
          <AnalyzeForm onSubmit={handleStartAnalysis} isLoading={isLoading || phase === 'validating'} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Progress - Phase 1 */}
        {phase === 'identifying' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ProgressSteps steps={steps} />
          </div>
        )}

        {/* Competitor Validation */}
        {phase === 'validating' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Competitors for {companyName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review and approve the identified competitors. Uncheck any that are not relevant.
              </p>
            </div>

            <div className="space-y-3">
              {competitors.map((competitor, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    competitor.approved
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={competitor.approved}
                    onChange={() => toggleCompetitor(index)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{competitor.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {competitor.relevanceScore}% match
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{competitor.description}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{competitor.url}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {someRejected && (
                <button
                  onClick={handleReplaceCompetitors}
                  disabled={replacingCompetitors}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {replacingCompetitors ? 'Finding replacements...' : 'Find Replacements'}
                </button>
              )}
              <button
                onClick={handleContinueAnalysis}
                disabled={isLoading || competitors.filter((c) => c.approved).length === 0}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                Continue with {competitors.filter((c) => c.approved).length} Competitor{competitors.filter((c) => c.approved).length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Progress - Phase 2 */}
        {phase === 'analyzing' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ProgressSteps steps={steps} />
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
