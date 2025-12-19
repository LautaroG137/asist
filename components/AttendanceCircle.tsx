
import React from 'react';

interface AttendanceCircleProps {
  absences: number; // Puede ser decimal (ej: 2.5 para 2 faltas y 1 tarde)
  maxAbsences: number;
}

export const AttendanceCircle: React.FC<AttendanceCircleProps> = ({ absences, maxAbsences }) => {
  const percentage = maxAbsences > 0 ? (absences / maxAbsences) * 100 : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let colorClass = 'text-green-400';
  let strokeClass = 'stroke-green-400';
  if (percentage >= 80) {
    colorClass = 'text-red-400';
    strokeClass = 'stroke-red-400';
  } else if (percentage >= 50) {
    colorClass = 'text-yellow-400';
    strokeClass = 'stroke-yellow-400';
  }

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="stroke-current text-gray-700"
          strokeWidth="10"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={`stroke-current ${strokeClass} transition-all duration-500`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className={`absolute flex flex-col items-center justify-center ${colorClass}`}>
        <span className="text-4xl font-bold">{absences % 1 === 0 ? absences : absences.toFixed(1)}</span>
        <span className="text-sm">Faltas</span>
      </div>
    </div>
  );
};
