"use client";

interface MultiChoiceTestCardProps {
  questionNumber: number;
  question: string;
  options: { key: string; value: string }[];
  selectedAnswer?: string;
  onAnswerSelect: (optionKey: string) => void;
}

export default function MultiChoiceTestCard({
  questionNumber,
  question,
  options,
  selectedAnswer,
  onAnswerSelect,
}: MultiChoiceTestCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5">
      <p className="mb-4 text-sm font-medium text-zinc-900">
        <span className="mr-2 text-purple-500">{questionNumber}.</span>
        {question}
      </p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onAnswerSelect(opt.key)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
              selectedAnswer === opt.key
                ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-purple-300 hover:bg-purple-50/50"
            }`}
          >
            {opt.value}
          </button>
        ))}
      </div>
    </div>
  );
}
