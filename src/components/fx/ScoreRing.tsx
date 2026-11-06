import React, { useEffect, useId, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { AnimatedNumber } from './AnimatedNumber';

interface ScoreRingProps {
  value: number; // 0-100
  size?: number;
  from: string; // gradient start
  to: string; // gradient end
  label?: string;
}

/** Circular 0–100 gauge that sweeps in on mount and when the value changes. */
export const ScoreRing: React.FC<ScoreRingProps> = ({ value, size = 92, from, to, label = 'quality' }) => {
  const id = useId();
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setProgress(Math.max(0, Math.min(100, value))));
    return () => cancelAnimationFrame(t);
  }, [value]);

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }} role="img" aria-label={`${label} ${value} out of 100`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - progress / 100)}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontWeight: 900, fontSize: size * 0.27, lineHeight: 1, color: '#f8fafc' }}>
          <AnimatedNumber value={value} />
        </Typography>
        <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mt: 0.3 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
};
