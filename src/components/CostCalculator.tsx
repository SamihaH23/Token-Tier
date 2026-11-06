import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Slider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Alert,
} from '@mui/material';
import { Calculator, TrendingDown } from 'lucide-react';
import { TASK_GROUPS } from '../data/prompts';
import { PRICES_AS_OF, SUPPORTED_MODELS, getModel } from '../data/models';
import { PromptView, Tier, TIERS } from '../types/prompt';
import { getPromptIdForTier, getTask } from '../data/selectors';
import { projectCost, DEFAULT_OUTPUT_TOKENS } from '../utils/cost';
import { TIER_THEME, tierVars } from '../theme/tiers';
import { AnimatedNumber } from './fx/AnimatedNumber';
import { useEvalResults } from '../state/evalResults';

const TIER_STYLE = Object.fromEntries(
  TIERS.map((t) => [t, { label: `${TIER_THEME[t].emoji} ${TIER_THEME[t].name} · ${TIER_THEME[t].budget}`, color: TIER_THEME[t].color, bg: TIER_THEME[t].soft }])
) as Record<Tier, { label: string; color: string; bg: string }>;

// Log-scale slider: position 0..100 maps to 1K..10M calls/day.
const MIN_CALLS = 1_000;
const MAX_CALLS = 10_000_000;
const toCalls = (pos: number) => {
  const raw = MIN_CALLS * Math.pow(MAX_CALLS / MIN_CALLS, pos / 100);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / magnitude) * magnitude; // 2 significant figures
};
const toPos = (calls: number) => (100 * Math.log(calls / MIN_CALLS)) / Math.log(MAX_CALLS / MIN_CALLS);
const fmtCalls = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1000}K`);
const usd = (n: number, digits = 2) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

const inputSx = {
  bgcolor: 'rgba(15, 23, 42, 0.8)',
  color: '#f8fafc',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
};

interface CostCalculatorProps {
  taskId: string;
  onTaskChange: (taskId: string) => void;
}

export const CostCalculator: React.FC<CostCalculatorProps> = ({ taskId, onTaskChange }) => {
  const { views } = useEvalResults();
  const [dailyCalls, setDailyCalls] = useState<number>(50_000);
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-haiku-5-5');
  const [outputOverride, setOutputOverride] = useState<string>('');

  const task = getTask(taskId);
  const model = getModel(selectedModelId);
  const prompts: Record<Tier, PromptView> = {
    bare: views[getPromptIdForTier(task, 'bare')],
    standard: views[getPromptIdForTier(task, 'standard')],
    robust: views[getPromptIdForTier(task, 'robust')],
  };

  // Output tokens: user override, else measured average (if any), else default.
  const parsedOverride = Number(outputOverride);
  const outputFor = (p: PromptView) =>
    outputOverride !== '' && Number.isFinite(parsedOverride) && parsedOverride >= 0
      ? parsedOverride
      : p.source === 'measured'
        ? p.avg_output_tokens
        : DEFAULT_OUTPUT_TOKENS;

  const costs = Object.fromEntries(
    TIERS.map((t) => [t, projectCost(prompts[t].token_count, outputFor(prompts[t]), model, dailyCalls)])
  ) as Record<Tier, ReturnType<typeof projectCost>>;

  const maxMonthly = Math.max(...TIERS.map((t) => costs[t].monthlyCost));

  const pairs: [Tier, Tier][] = [
    ['robust', 'standard'],
    ['robust', 'bare'],
    ['standard', 'bare'],
  ];

  return (
    <Box sx={{ py: 3 }}>
      <Box className="glass-panel" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Calculator color="#10b981" size={24} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>
            Production Token Cost Calculator
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
          Project daily, monthly and annual API spend per tier. Input cost covers the prompt template only (your
          per-call input data costs the same on every tier). Prices as of {PRICES_AS_OF}.
        </Typography>

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box sx={{ px: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" id="calls-label" sx={{ color: '#f1f5f9', fontWeight: 700 }}>
                  Daily API Call Volume
                </Typography>
                <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 800 }}>
                  {dailyCalls.toLocaleString()} calls / day
                </Typography>
              </Box>
              <Slider
                aria-labelledby="calls-label"
                value={toPos(dailyCalls)}
                onChange={(_, val) => setDailyCalls(toCalls(val as number))}
                min={0}
                max={100}
                step={0.5}
                valueLabelDisplay="off"
                sx={{ color: '#10b981', '& .MuiSlider-thumb': { boxShadow: '0 0 12px rgba(16,185,129,0.5)' } }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                {[5_000, 25_000, 100_000, 1_000_000, 10_000_000].map((preset) => (
                  <Chip
                    key={preset}
                    label={fmtCalls(preset)}
                    size="small"
                    onClick={() => setDailyCalls(preset)}
                    color={dailyCalls === preset ? 'success' : 'default'}
                    sx={{ fontWeight: 600, ml: '0 !important' }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Task</InputLabel>
              <Select value={task.id} label="Task" onChange={(e) => onTaskChange(e.target.value)} sx={inputSx}>
                {TASK_GROUPS.map((tg) => (
                  <MenuItem key={tg.id} value={tg.id}>
                    {tg.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Model</InputLabel>
              <Select value={model.id} label="Model" onChange={(e) => setSelectedModelId(e.target.value)} sx={inputSx}>
                {SUPPORTED_MODELS.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Output tokens / call"
              placeholder={`auto (${DEFAULT_OUTPUT_TOKENS})`}
              value={outputOverride}
              onChange={(e) => setOutputOverride(e.target.value)}
              inputProps={{ min: 0 }}
              InputLabelProps={{ shrink: true, sx: { color: '#94a3b8' } }}
              helperText="Blank = measured avg, else 50"
              sx={{ '& .MuiOutlinedInput-root': inputSx, input: { color: '#f8fafc' } }}
            />
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }} className="stagger">
        {TIERS.map((tier) => {
          const p = prompts[tier];
          const c = costs[tier];
          const style = TIER_STYLE[tier];
          return (
            <Grid item xs={12} md={4} key={tier}>
              <Box className="glass-panel tier-card" style={tierVars(tier)} sx={{ p: 3, overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: TIER_THEME[tier].gradient }} />
                <Chip label={style.label} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 800, mb: 1.5 }} />
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  Prompt ≈<strong>{p.token_count}</strong> tk · Output <strong>{outputFor(p)}</strong> tk · Quality{' '}
                  <strong>{p.quality_score}/100</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  Monthly API Cost
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.5, background: TIER_THEME[tier].gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                  <AnimatedNumber value={c.monthlyCost} format={(n) => usd(n)} />
                </Typography>
                <Box sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden', mb: 2 }}>
                  <Box
                    className="grow-bar shine"
                    sx={{ height: '100%', borderRadius: 4, background: TIER_THEME[tier].gradient, width: `${(c.monthlyCost / Math.max(1e-9, maxMonthly)) * 100}%` }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Daily: {usd(c.dailyCost)}</Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Annual: {usd(c.annualCost, 0)}</Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Alert
        icon={<TrendingDown color="#10b981" size={24} />}
        sx={{ mb: 4, bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', color: '#e2e8f0' }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6ee7b7', mb: 1 }}>
          Savings by switching tier ({model.name}, {dailyCalls.toLocaleString()} calls/day)
        </Typography>
        <Stack spacing={0.75}>
          {pairs.map(([from, to]) => {
            const saved = costs[from].monthlyCost - costs[to].monthlyCost;
            const qDelta = prompts[to].quality_score - prompts[from].quality_score;
            return (
              <Typography key={`${from}-${to}`} variant="body2" sx={{ color: '#f1f5f9' }}>
                <strong style={{ textTransform: 'capitalize' }}>{from}</strong> →{' '}
                <strong style={{ textTransform: 'capitalize' }}>{to}</strong>: save{' '}
                <strong style={{ color: '#10b981' }}>
                  <AnimatedNumber value={saved} format={(n) => usd(n, 0)} />
                  /mo
                </strong>{' '}
                ({usd(saved * 12, 0)}/yr){saved * 12 >= 1000 ? ' 💸' : ''}, quality{' '}
                {qDelta >= 0 ? '+' : ''}
                {qDelta} pts
              </Typography>
            );
          })}
        </Stack>
      </Alert>

      <Box className="glass-panel" sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
          Monthly cost by model ({dailyCalls.toLocaleString()} calls/day)
        </Typography>
        <TableContainer component={Paper} sx={{ background: 'transparent' }}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)' }}>
              <TableRow>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Model</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>$ / 1M in · out</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>~p50 latency</TableCell>
                {TIERS.map((t) => (
                  <TableCell key={t} sx={{ color: TIER_STYLE[t].color, fontWeight: 700, textTransform: 'capitalize' }}>
                    {t}
                  </TableCell>
                ))}
                <TableCell sx={{ color: '#38bdf8', fontWeight: 700 }}>Robust → Standard saves</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SUPPORTED_MODELS.map((m) => {
                const row = Object.fromEntries(
                  TIERS.map((t) => [t, projectCost(prompts[t].token_count, outputFor(prompts[t]), m, dailyCalls).monthlyCost])
                ) as Record<Tier, number>;
                return (
                  <TableRow
                    key={m.id}
                    selected={m.id === model.id}
                    hover
                    onClick={() => setSelectedModelId(m.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: '#f8fafc' }}>
                      {m.name}
                      <Typography component="span" variant="caption" sx={{ color: '#64748b', ml: 1 }}>
                        {m.provider}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>
                      ${m.input_cost_per_1m} · ${m.output_cost_per_1m}
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{m.avg_latency_ms} ms</TableCell>
                    {TIERS.map((t) => (
                      <TableCell key={t} sx={{ color: TIER_STYLE[t].color, fontWeight: 600 }}>
                        {usd(row[t])}
                      </TableCell>
                    ))}
                    <TableCell sx={{ color: '#38bdf8', fontWeight: 700 }}>{usd(row.robust - row.standard)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};
