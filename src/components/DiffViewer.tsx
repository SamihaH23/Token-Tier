import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Alert
} from '@mui/material';
import { GitCompare, ArrowRight, Scissors } from 'lucide-react';
import { TASK_GROUPS } from '../data/prompts';
import { Tier } from '../types/prompt';
import { computeTextDiff, getDiffStats } from '../utils/diffHelper';
import { getPromptIdForTier, getTask } from '../data/selectors';
import { useEvalResults } from '../state/evalResults';

interface DiffViewerProps {
  taskId: string;
  tierA: Tier;
  tierB: Tier;
  onChange: (taskId: string, tierA: Tier, tierB: Tier) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ taskId, tierA, tierB, onChange }) => {
  const { views } = useEvalResults();
  const selectedTask = getTask(taskId);
  const setTaskId = (id: string) => onChange(id, tierA, tierB);
  const setTierA = (t: Tier) => onChange(selectedTask.id, t, tierB);
  const setTierB = (t: Tier) => onChange(selectedTask.id, tierA, t);

  const promptA = views[getPromptIdForTier(selectedTask, tierA)];
  const promptB = views[getPromptIdForTier(selectedTask, tierB)];

  const diffParts = computeTextDiff(promptA.prompt_text, promptB.prompt_text);
  const stats = getDiffStats(diffParts);

  const tokenDelta = promptB.token_count - promptA.token_count;
  const qualityDelta = promptB.quality_score - promptA.quality_score;
  const costDelta = (promptB.cost_per_1k_calls - promptA.cost_per_1k_calls).toFixed(3);

  return (
    <Box sx={{ py: 3 }}>
      {/* Selection Header */}
      <Box className="glass-panel" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <GitCompare color="#10b981" size={24} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>
            Prompt <span className="gradient-text">Diff</span>
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
          Compare exact token edits between tiers to see what ceremony or constraints were cut and the resulting quality & cost impact.
        </Typography>

        <Grid container spacing={2} alignItems="center">
          {/* Task Select */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Task Group</InputLabel>
              <Select
                value={selectedTask.id}
                label="Task Group"
                onChange={(e) => setTaskId(e.target.value)}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                {TASK_GROUPS.map((tg) => (
                  <MenuItem key={tg.id} value={tg.id}>
                    {tg.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Tier A Select */}
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Base Tier (A)</InputLabel>
              <Select
                value={tierA}
                label="Base Tier (A)"
                onChange={(e) => setTierA(e.target.value as Tier)}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                <MenuItem value="bare">Bare Tier (≤30 tokens)</MenuItem>
                <MenuItem value="standard">Standard Tier (30-100 tokens)</MenuItem>
                <MenuItem value="robust">Robust Tier (100-300 tokens)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={1} sx={{ textAlign: 'center' }}>
            <ArrowRight size={20} color="#94a3b8" />
          </Grid>

          {/* Tier B Select */}
          <Grid item xs={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Comparison Tier (B)</InputLabel>
              <Select
                value={tierB}
                label="Comparison Tier (B)"
                onChange={(e) => setTierB(e.target.value as Tier)}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                <MenuItem value="bare">Bare Tier (≤30 tokens)</MenuItem>
                <MenuItem value="standard">Standard Tier (30-100 tokens)</MenuItem>
                <MenuItem value="robust">Robust Tier (100-300 tokens)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Diff Impact Summary Bar */}
      <Grid container spacing={2} sx={{ mb: 4 }} className="stagger">
        <Grid item xs={12} sm={4}>
          <Box className="glass-panel" sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
              Token Count Delta
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: tokenDelta > 0 ? '#f59e0b' : '#10b981' }}>
              {tokenDelta > 0 ? `+${tokenDelta}` : tokenDelta} Tokens
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {promptA.token_count} tk ({tierA.toUpperCase()}) vs {promptB.token_count} tk ({tierB.toUpperCase()})
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Box className="glass-panel" sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
              Quality Score Delta
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: qualityDelta > 0 ? '#38bdf8' : '#eab308' }}>
              {qualityDelta > 0 ? `+${qualityDelta}` : qualityDelta} pts
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {promptA.quality_score}/100 vs {promptB.quality_score}/100
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Box className="glass-panel" sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
              Cost Delta / 1K Calls
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: Number(costDelta) > 0 ? '#f43f5e' : '#10b981' }}>
              {Number(costDelta) > 0 ? `+$${costDelta}` : `-$${Math.abs(Number(costDelta)).toFixed(3)}`}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              ${promptA.cost_per_1k_calls.toFixed(3)} vs ${promptB.cost_per_1k_calls.toFixed(3)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Visual Text Diff Display */}
      <Box className="glass-panel" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc' }}>
            Visual Word-Level Prompt Diff:
          </Typography>
          <Stack direction="row" spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: 'rgba(239, 68, 68, 0.4)' }} />
              <Typography variant="caption" sx={{ color: '#fca5a5' }}>Removed in Base Tier ({tierA})</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: 'rgba(16, 185, 129, 0.4)' }} />
              <Typography variant="caption" sx={{ color: '#6ee7b7' }}>Added in Comparison Tier ({tierB})</Typography>
            </Box>
          </Stack>
        </Box>

        <Box className="prompt-code-block" key={`${selectedTask.id}-${tierA}-${tierB}`} sx={{ minHeight: 180, fontSize: '0.95rem' }}>
          {diffParts.map((part, index) => {
            const delay = { animationDelay: `${Math.min(index, 40) * 20}ms` };
            if (part.added) {
              return (
                <span key={index} className="diff-added" style={delay}>
                  {part.value}
                </span>
              );
            }
            if (part.removed) {
              return (
                <span key={index} className="diff-removed" style={delay}>
                  {part.value}
                </span>
              );
            }
            return <span key={index}>{part.value}</span>;
          })}
        </Box>
      </Box>

      {/* Ceremony Analysis */}
      <Alert
        icon={<Scissors color="#38bdf8" size={22} />}
        sx={{
          bgcolor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          color: '#e2e8f0',
          borderRadius: '14px',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#38bdf8', mb: 0.5 }}>
          Engineering Prompt Optimization Analysis:
        </Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
          Going from <strong>{tierA.toUpperCase()}</strong> to <strong>{tierB.toUpperCase()}</strong> adds {stats.wordsAdded} words and removes {stats.wordsRemoved} ({stats.unchangedWords} unchanged), a change of {tokenDelta > 0 ? '+' : ''}{tokenDelta} tokens for a quality shift of {qualityDelta > 0 ? '+' : ''}{qualityDelta} points.
        </Typography>
      </Alert>
    </Box>
  );
};
