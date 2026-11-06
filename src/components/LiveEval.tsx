import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Download, FlaskConical, Play, Square, Trash2, Upload } from 'lucide-react';
import { TASK_GROUPS } from '../data/prompts';
import { getModel, SUPPORTED_MODELS } from '../data/models';
import { Provider, TIERS } from '../types/prompt';
import { getApiKey, isKeyRemembered, setApiKey } from '../state/apiKeys';
import { useEvalResults } from '../state/evalResults';
import { runCompletion } from '../utils/providers';
import { countJudgeCalls, EvalRunRecord, planJobs, runJobs, summarize } from '../utils/evalRunner';
import { costPerCall } from '../utils/cost';
import { celebrateBig } from './fx/celebrate';

const inputSx = {
  bgcolor: 'rgba(15, 23, 42, 0.8)',
  color: '#f8fafc',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
};

const KEY_HINTS: Record<Provider, string> = {
  Anthropic: 'sk-ant-…',
  OpenAI: 'sk-…',
  Google: 'AIza…',
  DeepSeek: 'sk-…',
};

export const LiveEval: React.FC = () => {
  const { recordStats, clearResults, exportResults, importResults, results } = useEvalResults();
  const [modelId, setModelId] = useState('claude-haiku-5-5');
  const [judgeId, setJudgeId] = useState('claude-haiku-5-5');
  const [taskIds, setTaskIds] = useState<string[]>([TASK_GROUPS[1].id]);
  const [concurrency, setConcurrency] = useState(3);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [remember, setRemember] = useState<Record<string, boolean>>({});
  const [records, setRecords] = useState<EvalRunRecord[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ severity: 'success' | 'error' | 'info'; text: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const model = getModel(modelId);
  const judgeModel = getModel(judgeId);
  const jobs = useMemo(() => planJobs(taskIds, TIERS), [taskIds]);
  const judgeCalls = countJudgeCalls(jobs);
  const providers = [...new Set<Provider>([model.provider, ...(judgeCalls > 0 ? [judgeModel.provider] : [])])];

  const keyFor = (p: Provider) => keys[p] ?? getApiKey(p);
  const rememberFor = (p: Provider) => remember[p] ?? isKeyRemembered(p);
  const missingKey = providers.find((p) => !keyFor(p));

  // Rough upper-bound cost estimate: ~250 input / ~300 output tokens per call (includes thinking).
  const estCost = jobs.length * costPerCall(250, 300, model) + judgeCalls * costPerCall(400, 50, judgeModel);

  const toggleTask = (id: string) =>
    setTaskIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const start = async () => {
    for (const p of providers) setApiKey(p, keyFor(p), rememberFor(p));
    const controller = new AbortController();
    abortRef.current = controller;
    setRecords([]);
    setMessage(null);
    setRunning(true);
    try {
      const done = await runJobs({
        jobs,
        model,
        judgeModel,
        concurrency,
        signal: controller.signal,
        complete: (m, prompt, signal) => runCompletion(m, prompt, keyFor(m.provider), signal),
        onRecord: (r) => setRecords((prev) => [...prev, r]),
      });
      const stats = summarize(done, model.id);
      recordStats(stats);
      const errors = done.filter((r) => r.error).length;
      if (!controller.signal.aborted && errors < done.length) celebrateBig();
      setMessage(
        controller.signal.aborted
          ? { severity: 'info', text: `Cancelled. Saved results for ${stats.length} prompt(s) from ${done.length} completed runs.` }
          : errors === done.length
            ? { severity: 'error', text: `All ${errors} runs failed: ${done[0]?.error ?? 'unknown error'}` }
            : { severity: 'success', text: `Done. ${stats.length} prompt(s) now show measured scores${errors ? ` (${errors} runs failed)` : ''}.` }
      );
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const download = () => {
    const blob = new Blob([exportResults()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tokentier-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const n = importResults(await file.text());
      setMessage({ severity: 'success', text: `Imported ${n} result(s).` });
    } catch (err) {
      setMessage({ severity: 'error', text: `Import failed: ${(err as Error).message}` });
    }
  };

  // Per-prompt rollup of this session's runs.
  const rollup = useMemo(() => {
    const rows = new Map<string, EvalRunRecord[]>();
    for (const r of records) rows.set(r.promptId, [...(rows.get(r.promptId) ?? []), r]);
    return [...rows.entries()].map(([promptId, rs]) => {
      const ok = rs.filter((r) => !r.error);
      const avg = (f: (r: EvalRunRecord) => number) => (ok.length ? Math.round(ok.reduce((a, r) => a + f(r), 0) / ok.length) : 0);
      return {
        promptId,
        task: TASK_GROUPS.find((t) => t.id === rs[0].taskId)?.name ?? rs[0].taskId,
        tier: rs[0].tier,
        runs: rs.length,
        errors: rs.length - ok.length,
        score: avg((r) => r.score),
        latency: avg((r) => r.latencyMs),
        inTok: avg((r) => r.inputTokens),
        outTok: avg((r) => r.outputTokens),
        lastError: rs.find((r) => r.error)?.error,
      };
    });
  }, [records]);

  const storedCount = Object.keys(results).length;

  return (
    <Box sx={{ py: 3 }}>
      <Box className="glass-panel" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <FlaskConical color="#10b981" size={24} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>
            Live <span className="gradient-text">Eval</span> 🧪
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          Run every tier of the selected tasks against real test inputs, score the outputs, and replace seed numbers
          with measured quality, latency and token usage. Classification, routing, extraction, SQL and address tasks
          are scored by rules; summarisation, code review and rewrites are graded by a judge model.
        </Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
        Your API key is used directly from this browser and sent only to the provider you pick. It is kept in session
        storage (cleared when the tab closes) unless you tick “remember”. Runs bill your account.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Box className="glass-panel" sx={{ p: 3, height: '100%' }}>
            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#94a3b8' }}>Model under test</InputLabel>
                <Select value={modelId} label="Model under test" onChange={(e) => setModelId(e.target.value)} sx={inputSx}>
                  {SUPPORTED_MODELS.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#94a3b8' }}>Judge model</InputLabel>
                <Select value={judgeId} label="Judge model" onChange={(e) => setJudgeId(e.target.value)} sx={inputSx}>
                  {SUPPORTED_MODELS.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {providers.map((p) => (
                <Box key={p}>
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    autoComplete="off"
                    label={`${p} API key`}
                    placeholder={KEY_HINTS[p]}
                    value={keyFor(p)}
                    onChange={(e) => setKeys((k) => ({ ...k, [p]: e.target.value.trim() }))}
                    InputLabelProps={{ shrink: true, sx: { color: '#94a3b8' } }}
                    sx={{ '& .MuiOutlinedInput-root': inputSx, input: { color: '#f8fafc' } }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={rememberFor(p)}
                        onChange={(e) => setRemember((r) => ({ ...r, [p]: e.target.checked }))}
                      />
                    }
                    label={<Typography variant="caption" sx={{ color: '#94a3b8' }}>Remember on this device</Typography>}
                  />
                </Box>
              ))}

              <TextField
                size="small"
                type="number"
                label="Parallel requests"
                value={concurrency}
                onChange={(e) => setConcurrency(Math.min(8, Math.max(1, Number(e.target.value) || 1)))}
                inputProps={{ min: 1, max: 8 }}
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                sx={{ width: 160, '& .MuiOutlinedInput-root': inputSx, input: { color: '#f8fafc' } }}
              />
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box className="glass-panel" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
              Tasks to evaluate (all 3 tiers × 5 test cases each)
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {TASK_GROUPS.map((t) => (
                <Chip
                  key={t.id}
                  label={t.name}
                  onClick={() => toggleTask(t.id)}
                  color={taskIds.includes(t.id) ? 'success' : 'default'}
                  variant={taskIds.includes(t.id) ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setTaskIds(TASK_GROUPS.map((t) => t.id))} sx={{ textTransform: 'none' }}>
                Select all
              </Button>
              <Button size="small" onClick={() => setTaskIds([])} sx={{ textTransform: 'none' }}>
                Clear
              </Button>
            </Stack>

            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              <strong>{jobs.length}</strong> calls to {model.name}
              {judgeCalls > 0 && (
                <>
                  {' '}+ <strong>{judgeCalls}</strong> judge calls to {judgeModel.name}
                </>
              )}
              . Rough cost: <strong>≤ ${estCost < 0.01 ? estCost.toFixed(4) : estCost.toFixed(2)}</strong>
            </Typography>

            <Box sx={{ mt: 'auto' }}>
              {running && (
                <LinearProgress
                  variant="determinate"
                  className="shine"
                  value={(records.length / Math.max(1, jobs.length)) * 100}
                  sx={{ mb: 1.5, height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #10b981, #8b5cf6, #ec4899)' } }}
                />
              )}
              <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
                {running ? (
                  <Button variant="outlined" color="warning" startIcon={<Square size={16} />} onClick={() => abortRef.current?.abort()}>
                    Cancel ({records.length}/{jobs.length})
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Play size={16} />}
                    disabled={jobs.length === 0 || !!missingKey}
                    onClick={start}
                    sx={{ fontWeight: 700 }}
                  >
                    {missingKey ? `Add ${missingKey} key` : 'Run eval'}
                  </Button>
                )}
                <Button variant="outlined" startIcon={<Download size={16} />} onClick={download} disabled={storedCount === 0}>
                  Export
                </Button>
                <Button variant="outlined" startIcon={<Upload size={16} />} onClick={() => fileRef.current?.click()}>
                  Import
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(e) => {
                    void onImport(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="text"
                  color="error"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => {
                    if (window.confirm('Clear all saved eval results? Scores revert to seed values.')) clearResults();
                  }}
                  disabled={storedCount === 0}
                >
                  Clear saved ({storedCount})
                </Button>
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {message && (
        <Alert severity={message.severity} sx={{ mt: 3, borderRadius: '12px' }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {rollup.length > 0 && (
        <TableContainer component={Paper} className="glass-panel" sx={{ mt: 3, background: 'transparent' }}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead sx={{ bgcolor: 'rgba(15, 23, 42, 0.9)' }}>
              <TableRow>
                {['Task', 'Tier', 'Runs', 'Score', 'Avg latency', 'Input tk', 'Output tk', 'Errors'].map((h) => (
                  <TableCell key={h} sx={{ color: '#94a3b8', fontWeight: 700 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rollup.map((r) => (
                <TableRow key={r.promptId} className="row-anim">
                  <TableCell sx={{ color: '#f8fafc', fontWeight: 600 }}>{r.task}</TableCell>
                  <TableCell sx={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{r.tier}</TableCell>
                  <TableCell sx={{ color: '#cbd5e1' }}>{r.runs}</TableCell>
                  <TableCell sx={{ color: r.score >= 90 ? '#10b981' : '#eab308', fontWeight: 700 }}>{r.score}</TableCell>
                  <TableCell sx={{ color: '#cbd5e1' }}>{r.latency} ms</TableCell>
                  <TableCell sx={{ color: '#cbd5e1' }}>{r.inTok}</TableCell>
                  <TableCell sx={{ color: '#cbd5e1' }}>{r.outTok}</TableCell>
                  <TableCell sx={{ color: r.errors ? '#f87171' : '#64748b' }} title={r.lastError}>
                    {r.errors}
                    {r.lastError && (
                      <Typography variant="caption" sx={{ display: 'block', color: '#fca5a5', maxWidth: 280 }} noWrap>
                        {r.lastError}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
