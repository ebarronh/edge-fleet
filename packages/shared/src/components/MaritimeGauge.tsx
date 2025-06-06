import React from 'react';
import { clsx } from 'clsx';

interface MaritimeGaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  color?: 'blue' | 'green' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MaritimeGauge: React.FC<MaritimeGaugeProps> = ({
  value,
  min,
  max,
  unit,
  label,
  color = 'blue',
  size = 'md',
  className
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  };

  const colorClasses = {
    blue: {
      bg: 'bg-ocean-100',
      border: 'border-ocean-200',
      needle: 'bg-ocean-600',
      text: 'text-ocean-600'
    },
    green: {
      bg: 'bg-green-100',
      border: 'border-green-200',
      needle: 'bg-green-600',
      text: 'text-green-600'
    },
    amber: {
      bg: 'bg-amber-100',
      border: 'border-amber-200',
      needle: 'bg-amber-600',
      text: 'text-amber-600'
    },
    red: {
      bg: 'bg-red-100',
      border: 'border-red-200',
      needle: 'bg-red-600',
      text: 'text-red-600'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <div className={clsx(
        'relative rounded-full border-4 p-4',
        sizeClasses[size],
        colors.bg,
        colors.border
      )}>
        {/* Gauge background */}
        <div className="absolute inset-4 rounded-full bg-white shadow-inner">
          {/* Scale marks */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Major tick marks */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const tickAngle = (tick / 100) * 180 - 90;
              const x1 = 50 + 35 * Math.cos((tickAngle * Math.PI) / 180);
              const y1 = 50 + 35 * Math.sin((tickAngle * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos((tickAngle * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin((tickAngle * Math.PI) / 180);
              
              return (
                <line
                  key={tick}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-navy-400"
                />
              );
            })}
            
            {/* Gauge arc */}
            <path
              d="M 15 50 A 35 35 0 0 1 85 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-navy-200"
            />
            
            {/* Value arc */}
            <path
              d="M 15 50 A 35 35 0 0 1 85 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${(percentage / 100) * 110} 110`}
              className={colors.text}
            />
          </svg>
          
          {/* Needle */}
          <div 
            className="absolute top-1/2 left-1/2 origin-bottom w-0.5 h-8 -translate-x-0.5 -translate-y-8 transition-transform duration-500"
            style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
          >
            <div className={clsx('w-full h-full rounded-full', colors.needle)} />
          </div>
          
          {/* Center dot */}
          <div className={clsx(
            'absolute top-1/2 left-1/2 w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2',
            colors.needle
          )} />
        </div>
      </div>
      
      {/* Value display */}
      <div className="mt-3 text-center">
        <div className={clsx('text-2xl font-maritime font-bold', colors.text)}>
          {value.toFixed(1)}
        </div>
        <div className="text-sm text-navy-600 font-medium">
          {unit}
        </div>
        <div className="text-xs text-navy-500 mt-1">
          {label}
        </div>
      </div>
    </div>
  );
};