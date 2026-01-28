'use client';

import { useState, useEffect, useRef } from 'react';

export type StepStatus = 'pending' | 'in_progress' | 'complete' | 'error';

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

interface ProgressStepsProps {
  steps: Step[];
}

function formatElapsedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function StepTimer({ isActive }: { isActive: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      setElapsed(0);

      const interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isActive]);

  if (!isActive || elapsed === 0) {
    return null;
  }

  return (
    <span className="ml-2 text-xs text-gray-400">
      ({formatElapsedTime(elapsed)})
    </span>
  );
}

export default function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-700">Progress:</h3>
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            <StatusIcon status={step.status} />
            <span
              className={`text-sm ${
                step.status === 'complete'
                  ? 'text-gray-600'
                  : step.status === 'in_progress'
                  ? 'text-blue-600 font-medium'
                  : step.status === 'error'
                  ? 'text-red-600'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
              {step.status === 'in_progress' && '...'}
              <StepTimer isActive={step.status === 'in_progress'} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'complete':
      return (
        <svg
          className="w-5 h-5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    case 'in_progress':
      return (
        <svg
          className="w-5 h-5 text-blue-500 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    case 'error':
      return (
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  }
}
