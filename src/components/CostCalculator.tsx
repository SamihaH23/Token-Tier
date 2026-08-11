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
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Alert
} from '@mui/material';
import {
  Calculator,
  DollarSign,
  TrendingDown,
  Sparkles,
  Zap,
  Layers,
  Award
} from 'lucide-react';
import { PROMPTS, TASK_GROUPS } from '../data/prompts';
import { SUPPORTED_MODELS } from '../data/models';
import { ModelPricing, Tier } from '../types/prompt';

export const CostCalculator: React.FC = () => {
  const [dailyCalls, setDailyCalls] = useState<number>(50000); // Default 50k calls/day
  const [selectedTaskId, setSelectedTaskId] = useState<string>(TASK_GROUPS[0].id);
  const [selectedModelId, setSelectedModelId] = useState<string>(SUPPORTED_MODELS[0].id);

  const selectedTask = TASK_GROUPS.find((t) => t.id === selectedTaskId) || TASK_GROUPS[0];
  const selectedModel = SUPPORTED_MODELS.find((m) => m.id === selectedModelId) || SUPPORTED_MODELS[0];

  const barePrompt = PROMPTS.find((p) => p.id === selectedTask.bare_prompt_id)!;
  const standardPrompt = PROMPTS.find((p) => p.id === selectedTask.standard_prompt_id)!;
  const robustPrompt = PROMPTS.find((p) => p.id === selectedTask.robust_prompt_id)!;

  // Calculation logic based on model input/output pricing
  // Standard assumption: prompt token count is input tokens, + estimated output tokens (~50 tokens)
  const computeCost = (tokenCount: number, model: ModelPricing, calls: number) => {
    const inputTokensPerDay = tokenCount * calls;
    const outputTokensPerDay = 50 * calls; // Avg output token response

    const inputCost = (inputTokensPerDay / 1000000) * model.input_cost_per_1m;
    const outputCost = (outputTokensPerDay / 1000000) * model.output_cost_per_1m;

    const dailyCost = inputCost + outputCost;
    const monthlyCost = dailyCost * 30.5;
    const annualCost = dailyCost * 365;

    return { dailyCost, monthlyCost, annualCost };
  };

  const bareCosts = computeCost(barePrompt.token_count, selectedModel, dailyCalls);
  const standardCosts = computeCost(standardPrompt.token_count, selectedModel, dailyCalls);
  const robustCosts = computeCost(robustPrompt.token_count, selectedModel, dailyCalls);

  const monthlySavings = robustCosts.monthlyCost - standardCosts.monthlyCost;
  const annualSavings = robustCosts.annualCost - standardCosts.annualCost;

  return (
    <Box sx={{ py: 3 }}>
      {/* Calculator Header & Input Controls */}
      <Box className="glass-panel" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Calculator color="#10b981" size={24} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>
            Production Token Cost Calculator
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
          Project real-world daily, monthly, and annual LLM API bills across budget tiers as your application scales.
        </Typography>

        <Grid container spacing={3} alignItems="center">
          {/* Daily Call Volume Slider */}
          <Grid item xs={12} md={6}>
            <Box sx={{ px: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#f1f5f9', fontWeight: 700 }}>
                  Daily API Call Volume
                </Typography>
                <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 800 }}>
                  {dailyCalls.toLocaleString()} calls / day
                </Typography>
              </Box>

              <Slider
                value={dailyCalls}
                onChange={(_, val) => setDailyCalls(val as number)}
                min={1000}
                max={1000000}
                step={5000}
                sx={{
                  color: '#10b981',
                  '& .MuiSlider-thumb': { boxShadow: '0 0 12px rgba(16,185,129,0.5)' },
                }}
              />

              {/* Volume Preset Buttons */}
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {[5000, 25000, 100000, 500000, 1000000].map((preset) => (
                  <Chip
                    key={preset}
                    label={`${preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}K`}`}
                    size="small"
                    onClick={() => setDailyCalls(preset)}
                    color={dailyCalls === preset ? 'success' : 'default'}
                    sx={{ fontWeight: dailyCalls === preset ? 700 : 500, cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Task Group Dropdown */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Task Category</InputLabel>
              <Select
                value={selectedTaskId}
                label="Task Category"
                onChange={(e) => setSelectedTaskId(e.target.value)}
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

          {/* Model Selector Dropdown */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Target LLM Model</InputLabel>
              <Select
                value={selectedModelId}
                label="Target LLM Model"
                onChange={(e) => setSelectedModelId(e.target.value)}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                {SUPPORTED_MODELS.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* 3 Tier Cost Comparison Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Bare Tier */}
        <Grid item xs={12} md={4}>
          <Box
            className="glass-panel"
            sx={{
              p: 3,
              borderTop: '4px solid #10b981',
              bgcolor: 'rgba(16, 185, 129, 0.03)',
            }}
          >
            <Chip label="Bare Tier (≤30 tk)" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800, mb: 1.5 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Prompt tokens: <strong>{barePrompt.token_count}</strong> | Quality: <strong>{barePrompt.quality_score}/100</strong>
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Monthly API Cost</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981' }}>
                ${bareCosts.monthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Daily: ${bareCosts.dailyCost.toFixed(2)}</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Annual: ${bareCosts.annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
            </Box>
          </Box>
        </Grid>

        {/* Standard Tier */}
        <Grid item xs={12} md={4}>
          <Box
            className="glass-panel"
            sx={{
              p: 3,
              borderTop: '4px solid #3b82f6',
              bgcolor: 'rgba(59, 130, 246, 0.03)',
            }}
          >
            <Chip label="Standard Tier (30-100 tk)" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 800, mb: 1.5 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Prompt tokens: <strong>{standardPrompt.token_count}</strong> | Quality: <strong>{standardPrompt.quality_score}/100</strong>
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Monthly API Cost</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#3b82f6' }}>
                ${standardCosts.monthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Daily: ${standardCosts.dailyCost.toFixed(2)}</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Annual: ${standardCosts.annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
            </Box>
          </Box>
        </Grid>

        {/* Robust Tier */}
        <Grid item xs={12} md={4}>
          <Box
            className="glass-panel"
            sx={{
              p: 3,
              borderTop: '4px solid #f59e0b',
              bgcolor: 'rgba(245, 158, 11, 0.03)',
            }}
          >
            <Chip label="Robust Tier (100-300 tk)" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 800, mb: 1.5 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Prompt tokens: <strong>{robustPrompt.token_count}</strong> | Quality: <strong>{robustPrompt.quality_score}/100</strong>
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Monthly API Cost</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                ${robustCosts.monthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Daily: ${robustCosts.dailyCost.toFixed(2)}</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Annual: ${robustCosts.annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* ROI & Annual Savings Banner */}
      <Alert
        icon={<TrendingDown color="#10b981" size={24} />}
        sx={{
          mb: 4,
          bgcolor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          color: '#e2e8f0',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6ee7b7', mb: 0.5 }}>
          Annual ROI Savings Callout:
        </Typography>
        <Typography variant="body1" sx={{ color: '#f1f5f9' }}>
          Deploying <strong>Standard Tier</strong> instead of <strong>Robust Tier</strong> at <strong>{dailyCalls.toLocaleString()} calls/day</strong> on <strong>{selectedModel.name}</strong> saves your team <strong style={{ color: '#10b981' }}>${monthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} per month</strong> (<strong>${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} / year</strong>) while retaining a <strong>{standardPrompt.quality_score}/100</strong> quality score.
        </Typography>
      </Alert>

      {/* Multi-Model Cost Matrix */}
      <Box className="glass-panel" sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2 }}>
          Multi-Model Monthly Cost Projection Matrix ({dailyCalls.toLocaleString()} calls/day)
        </Typography>

        <TableContainer component={Paper} sx={{ background: 'transparent' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)' }}>
              <TableRow>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>LLM Model</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Provider</TableCell>
                <TableCell sx={{ color: '#10b981', fontWeight: 700 }}>Bare Tier Cost</TableCell>
                <TableCell sx={{ color: '#3b82f6', fontWeight: 700 }}>Standard Tier Cost</TableCell>
                <TableCell sx={{ color: '#f59e0b', fontWeight: 700 }}>Robust Tier Cost</TableCell>
                <TableCell sx={{ color: '#38bdf8', fontWeight: 700 }}>Monthly Savings (Std vs Rob)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SUPPORTED_MODELS.map((model) => {
                const bCosts = computeCost(barePrompt.token_count, model, dailyCalls);
                const sCosts = computeCost(standardPrompt.token_count, model, dailyCalls);
                const rCosts = computeCost(robustPrompt.token_count, model, dailyCalls);
                const savings = rCosts.monthlyCost - sCosts.monthlyCost;

                return (
                  <TableRow key={model.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#f8fafc' }}>{model.name}</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{model.provider}</TableCell>
                    <TableCell sx={{ color: '#10b981', fontWeight: 600 }}>${bCosts.monthlyCost.toFixed(2)}/mo</TableCell>
                    <TableCell sx={{ color: '#3b82f6', fontWeight: 600 }}>${sCosts.monthlyCost.toFixed(2)}/mo</TableCell>
                    <TableCell sx={{ color: '#f59e0b', fontWeight: 600 }}>${rCosts.monthlyCost.toFixed(2)}/mo</TableCell>
                    <TableCell sx={{ color: '#38bdf8', fontWeight: 700 }}>+${savings.toFixed(2)}/mo</TableCell>
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
