interface StepDotsProps {
  /** 1–totalSteps: marks 1..(current-1) as done, current as now, rest empty */
  current: 1 | 2 | 3 | 4 | 5 | 6;
  totalSteps?: 6;
}

export function StepDots({ current, totalSteps = 6 }: StepDotsProps) {
  const n = totalSteps;
  return (
    <div className="steps">
      {Array.from({ length: n }, (_, i) => i + 1).map((stepNum) => (
        <div
          key={stepNum}
          className={`step${stepNum < current ? "done" : stepNum === current ? "now" : ""}`}
        />
      ))}
    </div>
  );
}
