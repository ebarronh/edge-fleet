import { useEffect, useState } from 'react';

interface AnimatedGaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  criticalThreshold?: number;
}

export function AnimatedGauge({ 
  value, 
  max, 
  label, 
  unit, 
  color,
  criticalThreshold = max * 0.8 
}: AnimatedGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.min((animatedValue / max) * 100, 100);
  const isCritical = value > criticalThreshold;
  
  useEffect(() => {
    // Animate to new value
    const steps = 20;
    const increment = (value - animatedValue) / steps;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      setAnimatedValue(prev => {
        const newValue = prev + increment;
        return currentStep >= steps ? value : newValue;
      });
      
      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, 30);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  
  // Calculate arc path
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      
      <div className="relative w-24 h-24 mx-auto mb-2">
        {/* Background circle */}
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-700"
          />
          
          {/* Animated progress circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={isCritical ? '#ef4444' : color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            className="transition-all duration-300"
            strokeLinecap="round"
          />
          
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * 270 - 135;
            const x1 = 48 + 35 * Math.cos(angle * Math.PI / 180);
            const y1 = 48 + 35 * Math.sin(angle * Math.PI / 180);
            const x2 = 48 + 30 * Math.cos(angle * Math.PI / 180);
            const y2 = 48 + 30 * Math.sin(angle * Math.PI / 180);
            
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-600"
              />
            );
          })}
        </svg>
        
        {/* Value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${isCritical ? 'text-red-400' : 'text-white'} transition-colors`}>
            {animatedValue.toFixed(1)}
          </span>
          {isCritical && (
            <span className="text-xs text-red-400 animate-pulse">HIGH</span>
          )}
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-400">{label}</div>
      
      {/* Warning indicator */}
      {isCritical && (
        <div className="mt-2 px-2 py-1 bg-red-600/20 border border-red-500/30 rounded text-xs text-red-300 text-center">
          Above normal range
        </div>
      )}
    </div>
  );
}