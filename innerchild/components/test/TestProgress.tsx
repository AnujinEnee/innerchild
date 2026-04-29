"use client";

interface TestProgressProps {
  answered: number;
  total: number;
}

export default function TestProgress({ answered, total }: TestProgressProps) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="mb-6">
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
        <span>{answered}/{total} хариулсан</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-linear-to-r from-purple-500 to-pink-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
