'use client';

export interface CompetitorInfo {
  name: string;
  relevance: number;
}

interface CompetitorsListProps {
  competitors: CompetitorInfo[];
}

export default function CompetitorsList({ competitors }: CompetitorsListProps) {
  if (competitors.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-700">Competitors Identified:</h3>
      <div className="grid gap-2">
        {competitors.map((competitor, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-gray-200"
          >
            <span className="text-sm font-medium text-gray-800">
              {index + 1}. {competitor.name}
            </span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {competitor.relevance}% relevance
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
