import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { MetricSource } from '../types/prompt';

/** Shows whether a quality/latency number was measured by Live Eval or is a hand-entered seed. */
export const SourceBadge: React.FC<{ source: MetricSource; runs?: number }> = ({ source, runs }) => {
  const measured = source === 'measured';
  return (
    <Tooltip
      title={
        measured
          ? `Measured by Live Eval over ${runs ?? 0} test case run(s).`
          : 'Seed estimate — not yet measured. Run Live Eval to replace it.'
      }
    >
      <Chip
        label={measured ? 'measured' : 'seed'}
        size="small"
        sx={{
          height: 18,
          fontSize: '0.65rem',
          fontWeight: 700,
          bgcolor: measured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
          color: measured ? '#6ee7b7' : '#94a3b8',
        }}
      />
    </Tooltip>
  );
};
