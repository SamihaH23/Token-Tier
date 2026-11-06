import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Check, Clock, Copy, GitCompare, Sparkles, Target, Zap } from 'lucide-react';
import { TASK_GROUPS } from '../data/prompts';
import { PromptView, Tier, TIERS } from '../types/prompt';
import { calculateEfficiencyScore, TIER_MAX_TOKENS } from '../utils/tokenizer';
import { getTask } from '../data/selectors';
import { getModel } from '../data/models';
import { useEvalResults } from '../state/evalResults';
import { useCopy } from '../hooks/useCopy';
import { SourceBadge } from './SourceBadge';
import { TIER_THEME, tierVars } from '../theme/tiers';
import { AnimatedNumber } from './fx/AnimatedNumber';
import { ScoreRing } from './fx/ScoreRing';
import { burstFrom } from './fx/celebrate';
import { pickBestTier } from '../utils/recommend';

interface TierComparisonViewProps {
  taskId: string;
  onTaskChange: (taskId: string) => void;
  onOpenDiff: (taskId: string, tierA: Tier, tierB: Tier) => void;
}

export const TierComparisonView: React.FC<TierComparisonViewProps> = ({ taskId, onTaskChange, onOpenDiff }) => {
  const { views } = useEvalResults();
  const [qualityBar, setQualityBar] = useState(90);
  const cardRefs = useRef<Partial<Record<Tier, HTMLDivElement | null>>>({});
  const copyOrigin = useRef<Element | null>(null);
  const { copiedId, copy } = useCopy(() => burstFrom(copyOrigin.current, 18));

  const task = getTask(taskId);
  const prompts: Record<Tier, PromptView> = {
    bare: views[task.bare_prompt_id],
    standard: views[task.standard_prompt_id],
    robust: views[task.robust_prompt_id],
  };
  const best = pickBestTier(prompts, qualityBar);

  // Celebrate when the recommendation moves to a new tier (not on first render).
  const lastBest = useRef<Tier | null | undefined>(undefined);
  useEffect(() => {
    if (lastBest.current !== undefined && best && best !== lastBest.current) {
      burstFrom(cardRefs.current[best], 30);
    }
    lastBest.current = best;
  }, [best]);
  useEffect(() => {
    lastBest.current = undefined; // switching task shouldn't fire confetti
  }, [taskId]);

  const robust = prompts.robust;
  const pick = best ? prompts[best] : null;
  const savedPct = pick ? Math.round((1 - pick.cost_per_1k_calls / robust.cost_per_1k_calls) * 100) : 0;

  const renderCard = (tier: Tier) => {
    const p = prompts[tier];
    const theme = TIER_THEME[tier];
    const isBest = best === tier;
    const meets = p.quality_score >= qualityBar;
    const efficiency = calculateEfficiencyScore(p.quality_score, p.token_count);
    const budgetPct = Math.min(100, Math.round((p.token_count / TIER_MAX_TOKENS[tier]) * 100));
    const [from, to] = theme.gradient.match(/#[0-9a-f]{6}/gi) ?? [theme.color, theme.color];

    return (
      <Box
        ref={(el: HTMLDivElement | null) => {
          cardRefs.current[tier] = el;
        }}
        className={`glass-panel tier-card${isBest ? ' best-pick' : ''}${meets ? '' : ' dimmed'}`}
        style={tierVars(tier)}
        sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'visible' }}
      >
        {/* Gradient header strip */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, borderRadius: '16px 16px 0 0', background: theme.gradient }} />

        {isBest && (
          <Chip
            className="ribbon"
            label="🏆 Best pick"
            size="small"
            sx={{
              position: 'absolute',
              top: -12,
              right: 16,
              fontWeight: 800,
              color: '#0b0f19',
              background: 'linear-gradient(90deg, #fde68a, #f59e0b)',
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
            }}
          />
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, mt: 0.5 }}>
          <ScoreRing value={p.quality_score} from={from} to={to} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '1.35rem', lineHeight: 1.1 }}>
              <span style={{ marginRight: 6 }}>{theme.emoji}</span>
              <span style={{ background: theme.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {theme.name}
              </span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
              {theme.tagline} · {theme.budget}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} alignItems="center">
              <SourceBadge source={p.source} runs={p.runs} />
              <Tooltip title="Quality per token = quality ÷ tokens × 10">
                <Chip
                  icon={<Zap size={12} />}
                  label={<AnimatedNumber value={efficiency} format={(n) => `${n.toFixed(1)} Q/Tk`} />}
                  size="small"
                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: theme.soft, color: theme.color, '& .MuiChip-icon': { color: theme.color } }}
                />
              </Tooltip>
            </Stack>
          </Box>
        </Box>

        {/* Token budget */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
              Token budget used
            </Typography>
            <Typography variant="caption" sx={{ color: '#f1f5f9', fontWeight: 700 }}>
              ≈<AnimatedNumber value={p.token_count} /> / {TIER_MAX_TOKENS[tier]}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={budgetPct}
            className="shine"
            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar': { background: theme.gradient, borderRadius: 4 } }}
          />
        </Box>

        {/* Stats */}
        <Grid container spacing={1.25} sx={{ mb: 2 }}>
          {[
            { label: 'Cost / 1K calls', node: <AnimatedNumber value={p.cost_per_1k_calls} format={(n) => `$${n.toFixed(3)}`} />, color: '#38bdf8' },
            {
              label: 'p50 latency',
              node: (
                <>
                  <AnimatedNumber value={p.latency_p50_ms} /> ms
                </>
              ),
              color: '#f1f5f9',
            },
          ].map((s) => (
            <Grid item xs={6} key={s.label}>
              <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {s.label === 'p50 latency' && <Clock size={11} />}
                  {s.label}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: s.color }}>{s.node}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Prompt */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
            Prompt · {getModel(p.model_tested).name}
          </Typography>
          <Tooltip title={copiedId === p.id ? 'Copied!' : 'Copy prompt'}>
            <IconButton
              size="small"
              aria-label={`Copy ${tier} prompt`}
              onClick={(e) => {
                copyOrigin.current = e.currentTarget;
                void copy(p.prompt_text, p.id);
              }}
              sx={{
                color: copiedId === p.id ? '#10b981' : '#94a3b8',
                bgcolor: 'rgba(255,255,255,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { bgcolor: theme.soft, color: theme.color, transform: 'scale(1.12) rotate(-6deg)' },
              }}
            >
              {copiedId === p.id ? <Check size={14} /> : <Copy size={14} />}
            </IconButton>
          </Tooltip>
        </Box>
        <Box className="prompt-code-block" sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
          {p.prompt_text}
        </Box>

        <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.84rem', fontStyle: 'italic', mb: 1.5 }}>
          “{p.notes}”
        </Typography>
        {p.ceremony_removed && p.ceremony_removed.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
            {p.ceremony_removed.map((tag) => (
              <Chip
                key={tag}
                label={`✂️ ${tag}`}
                size="small"
                sx={{ height: 20, fontSize: '0.66rem', bgcolor: theme.soft, color: theme.color, border: `1px solid ${theme.color}33` }}
              />
            ))}
          </Stack>
        )}

        {tier !== 'robust' && (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<GitCompare size={14} />}
            onClick={() => onOpenDiff(task.id, tier, 'robust')}
            sx={{
              mt: 'auto',
              pt: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              color: '#f1f5f9',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: theme.color, bgcolor: theme.soft },
            }}
          >
            See what changed vs Robust
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ py: 3 }}>
      {/* Task + quality bar */}
      <Box className="glass-panel" sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography variant="caption" className="gradient-text" sx={{ fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Side-by-side tiers
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                {task.name}
              </Typography>
              <Chip
                label={task.category.replace('_', ' ')}
                size="small"
                sx={{ bgcolor: 'rgba(139, 92, 246, 0.18)', color: '#c4b5fd', fontWeight: 600, textTransform: 'capitalize' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              {task.description} — <em>{task.use_case_example}</em>
            </Typography>
            <FormControl sx={{ minWidth: 260, mt: 2 }} size="small">
              <InputLabel id="task-select-label" sx={{ color: '#94a3b8' }}>
                Task
              </InputLabel>
              <Select
                labelId="task-select-label"
                value={task.id}
                label="Task"
                onChange={(e) => onTaskChange(e.target.value)}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  borderRadius: '10px',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8b5cf6' },
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

          <Grid item xs={12} md={5}>
            <Box sx={{ p: 2.5, borderRadius: '14px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(139,92,246,0.12))', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography id="quality-bar-label" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Target size={18} color="#c4b5fd" /> Your quality bar
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1.6rem' }} className="gradient-text">
                  {qualityBar}
                </Typography>
              </Box>
              <Slider
                aria-labelledby="quality-bar-label"
                value={qualityBar}
                min={50}
                max={100}
                onChange={(_, v) => setQualityBar(v as number)}
                marks={TIERS.map((t) => ({ value: prompts[t].quality_score, label: TIER_THEME[t].emoji }))}
                sx={{
                  height: 8,
                  '& .MuiSlider-track': { border: 'none', background: 'linear-gradient(90deg, #10b981, #8b5cf6, #ec4899)' },
                  '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.15)' },
                  '& .MuiSlider-thumb': {
                    width: 22,
                    height: 22,
                    bgcolor: '#fff',
                    boxShadow: '0 0 0 6px rgba(139,92,246,0.25)',
                    '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 10px rgba(139,92,246,0.3)' },
                  },
                  '& .MuiSlider-mark': { bgcolor: '#fff', height: 10, width: 2 },
                  '& .MuiSlider-markLabel': { fontSize: '0.9rem', top: 30 },
                }}
              />
              <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 1.5, minHeight: 40 }}>
                {pick ? (
                  <>
                    Go with <strong style={{ color: TIER_THEME[best!].color }}>{TIER_THEME[best!].emoji} {TIER_THEME[best!].name}</strong> —
                    scores {pick.quality_score} and costs{' '}
                    <strong style={{ color: '#10b981' }}>{savedPct > 0 ? `${savedPct}% less` : 'the same'}</strong> than Robust.
                  </>
                ) : (
                  <>No tier reaches {qualityBar} yet — try lowering the bar, or run Live Eval for real scores.</>
                )}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3} className="stagger" key={task.id}>
        {TIERS.map((t) => (
          <Grid item xs={12} md={4} key={t}>
            {renderCard(t)}
          </Grid>
        ))}
      </Grid>

      <Alert
        icon={<Sparkles color="#c4b5fd" size={22} />}
        sx={{
          mt: 4,
          background: 'linear-gradient(90deg, rgba(16,185,129,0.08), rgba(139,92,246,0.1), rgba(236,72,153,0.08))',
          border: '1px solid rgba(139,92,246,0.25)',
          color: '#e2e8f0',
          borderRadius: '14px',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#e9d5ff', mb: 0.5 }}>
          Robust → Standard for “{task.name}”
        </Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
          Cuts <strong>{robust.token_count - prompts.standard.token_count} tokens/call</strong> (
          {Math.round((1 - prompts.standard.token_count / robust.token_count) * 100)}%), saves{' '}
          <strong>${(robust.cost_per_1k_calls - prompts.standard.cost_per_1k_calls).toFixed(3)} per 1K calls</strong>, and changes
          quality by <strong>{prompts.standard.quality_score - robust.quality_score} points</strong>.
        </Typography>
      </Alert>
    </Box>
  );
};
