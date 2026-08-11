import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Alert
} from '@mui/material';
import {
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Layers,
  ArrowRight,
  Sparkles,
  GitCompare,
  DollarSign,
  Clock
} from 'lucide-react';
import { PROMPTS, TASK_GROUPS } from '../data/prompts';
import { TaskGroup, Prompt, Tier } from '../types/prompt';
import { calculateEfficiencyScore } from '../utils/tokenizer';
import confetti from 'canvas-confetti';

interface TierComparisonViewProps {
  onOpenDiff: (taskId: string, tierA: Tier, tierB: Tier) => void;
}

export const TierComparisonView: React.FC<TierComparisonViewProps> = ({ onOpenDiff }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(TASK_GROUPS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedTask = TASK_GROUPS.find((t) => t.id === selectedTaskId) || TASK_GROUPS[0];

  const barePrompt = PROMPTS.find((p) => p.id === selectedTask.bare_prompt_id)!;
  const standardPrompt = PROMPTS.find((p) => p.id === selectedTask.standard_prompt_id)!;
  const robustPrompt = PROMPTS.find((p) => p.id === selectedTask.robust_prompt_id)!;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    confetti({
      particleCount: 20,
      spread: 40,
      origin: { y: 0.8 }
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Savings calculations (Standard vs Robust)
  const tokenSavingsPercent = Math.round(
    ((robustPrompt.token_count - standardPrompt.token_count) / robustPrompt.token_count) * 100
  );
  const costSavingsPer1k = (robustPrompt.cost_per_1k_calls - standardPrompt.cost_per_1k_calls).toFixed(3);
  const qualityDelta = robustPrompt.quality_score - standardPrompt.quality_score;

  const renderTierCard = (
    prompt: Prompt,
    tierName: string,
    tierType: Tier,
    maxBudget: number,
    glowClass: string,
    badgeBg: string,
    badgeColor: string
  ) => {
    const efficiency = calculateEfficiencyScore(prompt.quality_score, prompt.token_count);
    const budgetPercent = Math.min(100, Math.round((prompt.token_count / maxBudget) * 100));

    return (
      <Box
        className="glass-panel"
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          borderTop: `4px solid ${badgeColor}`,
        }}
      >
        <Box>
          {/* Header Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip
              label={tierName}
              size="medium"
              sx={{
                fontWeight: 800,
                fontSize: '0.85rem',
                bgcolor: badgeBg,
                color: badgeColor,
                border: `1px solid ${badgeColor}44`,
                px: 1,
              }}
            />
            <Tooltip title="Quality per Token Efficiency Score = (Quality / Token Count) * 10">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Zap size={14} color="#10b981" />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>
                  {efficiency} Q/Tk
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          {/* Token Budget Gauge */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                Token Count
              </Typography>
              <Typography variant="caption" sx={{ color: '#f1f5f9', fontWeight: 700 }}>
                {prompt.token_count} / {maxBudget} max
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={budgetPercent}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.08)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: badgeColor,
                  borderRadius: 3,
                },
              }}
            />
          </Box>

          {/* Quality & Cost Metric Grid */}
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid item xs={6}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                  Eval Quality Score
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#f1f5f9' }}>
                  {prompt.quality_score}<span style={{ fontSize: '0.8rem', color: '#64748b' }}>/100</span>
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                  Cost / 1K Calls
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#38bdf8' }}>
                  ${prompt.cost_per_1k_calls.toFixed(3)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Latency & Model Tested */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={14} color="#94a3b8" />
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                p50 Latency: <strong>{prompt.latency_p50_ms} ms</strong>
              </Typography>
            </Box>
            <Chip
              label={prompt.model_tested}
              size="small"
              sx={{ fontSize: '0.7rem', height: 20, bgcolor: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}
            />
          </Box>

          {/* Prompt Code Display */}
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                Prompt Text
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleCopy(prompt.prompt_text, prompt.id)}
                sx={{
                  color: copiedId === prompt.id ? '#10b981' : '#94a3b8',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                {copiedId === prompt.id ? <Check size={14} /> : <Copy size={14} />}
              </IconButton>
            </Box>
            <Box className="prompt-code-block" sx={{ maxHeight: 220, overflowY: 'auto' }}>
              {prompt.prompt_text}
            </Box>
          </Box>

          {/* Engineering Notes & Ceremony Tags */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Engineering Rationale:
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontStyle: 'italic', mb: 1.5 }}>
              "{prompt.notes}"
            </Typography>

            {prompt.ceremony_removed && prompt.ceremony_removed.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, display: 'block', mb: 0.5 }}>
                  ✂️ Ceremony Cut in this Tier:
                </Typography>
                <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.5}>
                  {prompt.ceremony_removed.map((tag, i) => (
                    <Chip
                      key={i}
                      label={tag}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        color: '#6ee7b7',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Box>

        {/* Diff Action */}
        {tierType !== 'robust' && (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<GitCompare size={14} />}
            onClick={() => onOpenDiff(selectedTask.id, tierType, 'robust')}
            sx={{
              mt: 3,
              borderColor: 'rgba(255,255,255,0.12)',
              color: '#f1f5f9',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: badgeColor,
                bgcolor: badgeBg,
              },
            }}
          >
            Diff vs Robust Tier
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ py: 3 }}>
      {/* Top Task Selector Header */}
      <Box
        className="glass-panel"
        sx={{
          p: 3,
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Interactive Side-by-Side Evaluation
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
              {selectedTask.name}
            </Typography>
            <Chip
              label={selectedTask.category}
              size="small"
              sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 600, textTransform: 'capitalize' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
            {selectedTask.description} — <em>Use case: {selectedTask.use_case_example}</em>
          </Typography>
        </Box>

        {/* Task Select Dropdown */}
        <FormControl sx={{ minWidth: 260 }} size="small">
          <InputLabel id="task-select-label" sx={{ color: '#94a3b8' }}>Select Task</InputLabel>
          <Select
            labelId="task-select-label"
            value={selectedTaskId}
            label="Select Task"
            onChange={(e) => setSelectedTaskId(e.target.value)}
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.8)',
              color: '#f8fafc',
              borderRadius: '10px',
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
            }}
          >
            {TASK_GROUPS.map((tg) => (
              <MenuItem key={tg.id} value={tg.id} sx={{ bgcolor: '#0f172a', color: '#f8fafc' }}>
                {tg.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 3-Tier Side-by-Side Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderTierCard(
            barePrompt,
            'Bare Tier (≤30 Tokens)',
            'bare',
            30,
            'badge-bare',
            'rgba(16, 185, 129, 0.15)',
            '#10b981'
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {renderTierCard(
            standardPrompt,
            'Standard Tier (30–100 Tokens)',
            'standard',
            100,
            'badge-standard',
            'rgba(59, 130, 246, 0.15)',
            '#3b82f6'
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {renderTierCard(
            robustPrompt,
            'Robust Tier (100–300 Tokens)',
            'robust',
            300,
            'badge-robust',
            'rgba(245, 158, 11, 0.15)',
            '#f59e0b'
          )}
        </Grid>
      </Grid>

      {/* Savings & Tradeoff Insight Banner */}
      <Alert
        icon={<Sparkles color="#10b981" size={22} />}
        sx={{
          mt: 4,
          bgcolor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#e2e8f0',
          borderRadius: '14px',
          '& .MuiAlert-icon': { pt: 0.5 }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#6ee7b7', mb: 0.5 }}>
          Efficiency Insight for "{selectedTask.name}":
        </Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
          Moving from <strong>Robust</strong> to <strong>Standard</strong> cuts token consumption by <strong>{tokenSavingsPercent}%</strong> ({robustPrompt.token_count - standardPrompt.token_count} tokens/call) and saves <strong>${costSavingsPer1k} per 1K calls</strong>, while sacrificing only <strong>{qualityDelta} quality points</strong> (scoring {standardPrompt.quality_score}/100 vs {robustPrompt.quality_score}/100).
        </Typography>
      </Alert>
    </Box>
  );
};
