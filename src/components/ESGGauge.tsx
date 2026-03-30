import React from "react";

interface ESGGaugeProps {
  score: number;
  grade: string;
  size?: number;
  label?: string;
  change?: number;
}

const ESGGauge: React.FC<ESGGaugeProps> = ({ score, grade, size = 200, label = "Your GreenCart Score", change }) => {
  const maxScore = 850;
  const minScore = 300;
  const pct = (score - minScore) / (maxScore - minScore);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 16;
  const startAngle = 135;
  const endAngle = 405;
  const totalArc = endAngle - startAngle;
  const scoreAngle = startAngle + pct * totalArc;

  const polarToCart = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos((angle * Math.PI) / 180),
    y: cy + radius * Math.sin((angle * Math.PI) / 180),
  });

  const describeArc = (startA: number, endA: number, radius: number) => {
    const start = polarToCart(endA, radius);
    const end = polarToCart(startA, radius);
    const largeArc = endA - startA > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  const gradeColor =
    score >= 750 ? "hsl(142 69% 58%)" :
    score >= 550 ? "hsl(43 96% 56%)" :
    "hsl(0 72% 71%)";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.8} viewBox={`0 0 ${size} ${size * 0.85}`}>
        {/* Background track */}
        <path
          d={describeArc(startAngle, endAngle, r)}
          fill="none"
          stroke="hsl(138 18% 17%)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Score arc - gradient from red to green */}
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(0 72% 71%)" />
            <stop offset="40%" stopColor="hsl(43 96% 56%)" />
            <stop offset="100%" stopColor="hsl(142 69% 58%)" />
          </linearGradient>
        </defs>
        <path
          d={describeArc(startAngle, scoreAngle, r)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={10}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px hsl(142 69% 58% / 0.3))" }}
        />
        {/* Score dot */}
        {(() => {
          const dot = polarToCart(scoreAngle, r);
          return <circle cx={dot.x} cy={dot.y} r={6} fill={gradeColor} style={{ filter: `drop-shadow(0 0 4px ${gradeColor})` }} />;
        })()}
        {/* Score text */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="font-mono" fill="hsl(120 40% 97%)" fontSize={size * 0.22} fontWeight={700}>
          {score}
        </text>
        {/* Grade pill */}
        <rect x={cx - 18} y={cy + 12} width={36} height={22} rx={11} fill={gradeColor + "22"} />
        <text x={cx} y={cy + 27} textAnchor="middle" fill={gradeColor} fontSize={13} fontWeight={600}>
          {grade}
        </text>
      </svg>
      <span className="text-xs text-foreground-secondary font-medium -mt-2">{label}</span>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${change >= 0 ? "text-primary" : "text-destructive"}`}>
          <span>{change >= 0 ? "▲" : "▼"}</span>
          <span>{Math.abs(change)} pts from last trip</span>
        </div>
      )}
    </div>
  );
};

export default ESGGauge;
