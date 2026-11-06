import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Stack,
} from '@mui/material';
import { Search, Copy, Check, Zap, GitCompare } from 'lucide-react';
import { SUPPORTED_MODELS } from '../data/models';
import { Tier } from '../types/prompt';
import { calculateEfficiencyScore } from '../utils/tokenizer';
import { getTaskForPrompt } from '../data/selectors';
import { useEvalResults } from '../state/evalResults';
import { useCopy } from '../hooks/useCopy';
import { SourceBadge } from './SourceBadge';
import { TIER_THEME } from '../theme/tiers';

interface LibraryCatalogProps {
  onSelectTaskForComparison: (taskId: string) => void;
  onOpenDiff: (taskId: string, tierA: Tier, tierB: Tier) => void;
}

export const LibraryCatalog: React.FC<LibraryCatalogProps> = ({
  onSelectTaskForComparison,
  onOpenDiff,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [minQuality, setMinQuality] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'efficiency' | 'quality' | 'tokens' | 'cost' | 'latency'>('efficiency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { viewList } = useEvalResults();
  const { copiedId, copy } = useCopy();

  const filteredPrompts = useMemo(() => {
    return viewList.filter((prompt) => {
      const taskGroup = getTaskForPrompt(prompt.id);

      // Search match
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        prompt.prompt_text.toLowerCase().includes(query) ||
        prompt.notes.toLowerCase().includes(query) ||
        (taskGroup && taskGroup.name.toLowerCase().includes(query));

      // Category match
      const matchesCategory = categoryFilter === 'all' || prompt.task_category === categoryFilter;

      // Tier match
      const matchesTier = tierFilter === 'all' || prompt.tier === tierFilter;

      // Model match
      const matchesModel = modelFilter === 'all' || prompt.model_tested === modelFilter;

      // Quality threshold
      const matchesQuality = prompt.quality_score >= minQuality;

      return matchesSearch && matchesCategory && matchesTier && matchesModel && matchesQuality;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === 'efficiency') {
        valA = calculateEfficiencyScore(a.quality_score, a.token_count);
        valB = calculateEfficiencyScore(b.quality_score, b.token_count);
      } else if (sortBy === 'quality') {
        valA = a.quality_score;
        valB = b.quality_score;
      } else if (sortBy === 'tokens') {
        valA = a.token_count;
        valB = b.token_count;
      } else if (sortBy === 'cost') {
        valA = a.cost_per_1k_calls;
        valB = b.cost_per_1k_calls;
      } else if (sortBy === 'latency') {
        valA = a.latency_p50_ms;
        valB = b.latency_p50_ms;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [viewList, searchQuery, categoryFilter, tierFilter, modelFilter, minQuality, sortBy, sortOrder]);

  const getTierColor = (tier: Tier) => ({ bg: TIER_THEME[tier].soft, color: TIER_THEME[tier].color });
  const maxEfficiency = Math.max(1, ...viewList.map((p) => calculateEfficiencyScore(p.quality_score, p.token_count)));
  const filterKey = [searchQuery, categoryFilter, tierFilter, modelFilter, minQuality, sortBy, sortOrder].join('|');

  return (
    <Box sx={{ py: 3 }}>
      {/* Search & Filter Control Bar */}
      <Box className="glass-panel" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc', mb: 2.5 }}>
          Prompt <span className="gradient-text">Library</span> & Efficiency Ranking
        </Typography>

        <Grid container spacing={2} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search prompts, tasks, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search size={18} color="#94a3b8" style={{ marginRight: 8 }} />,
              }}
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '8px',
                input: { color: '#f8fafc' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
              }}
            />
          </Grid>

          {/* Category Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="summarization">Summarization</MenuItem>
                <MenuItem value="classification">Classification</MenuItem>
                <MenuItem value="extraction">Extraction</MenuItem>
                <MenuItem value="code_generation">Code Generation</MenuItem>
                <MenuItem value="rewrite">Rewrite</MenuItem>
                <MenuItem value="routing">Routing</MenuItem>
                <MenuItem value="sql_generation">SQL Generation</MenuItem>
                <MenuItem value="data_cleaning">Data Cleaning</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Tier Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Budget Tier</InputLabel>
              <Select
                value={tierFilter}
                label="Budget Tier"
                onChange={(e) => setTierFilter(e.target.value)}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                <MenuItem value="all">All Tiers</MenuItem>
                <MenuItem value="bare">Bare (≤30 tokens)</MenuItem>
                <MenuItem value="standard">Standard (30-100 tokens)</MenuItem>
                <MenuItem value="robust">Robust (100-300 tokens)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Model Filter */}
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Model</InputLabel>
              <Select
                value={modelFilter}
                label="Model"
                onChange={(e) => setModelFilter(e.target.value)}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                }}
              >
                <MenuItem value="all">All Models</MenuItem>
                {SUPPORTED_MODELS.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Min Quality Slider */}
          <Grid item xs={6} md={2}>
            <Box sx={{ px: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Min Quality Threshold
                </Typography>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                  {minQuality}/100
                </Typography>
              </Box>
              <Slider
                value={minQuality}
                onChange={(_, val) => setMinQuality(val as number)}
                min={0}
                max={100}
                sx={{
                  color: '#10b981',
                  '& .MuiSlider-thumb': { boxShadow: '0 0 10px rgba(16,185,129,0.5)' },
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Sort & Layout Toggle Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1} sx={{ '& > *': { ml: '0 !important' } }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
              Sort by:
            </Typography>
            <Chip
              label="Quality / Token (Efficiency)"
              color={sortBy === 'efficiency' ? 'success' : 'default'}
              onClick={() => {
                setSortBy('efficiency');
                setSortOrder('desc');
              }}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label="Quality Score"
              variant={sortBy === 'quality' ? 'filled' : 'outlined'}
              onClick={() => {
                setSortBy('quality');
                setSortOrder('desc');
              }}
              sx={{ color: '#f1f5f9' }}
            />
            <Chip
              label="Token Count"
              variant={sortBy === 'tokens' ? 'filled' : 'outlined'}
              onClick={() => {
                setSortBy('tokens');
                setSortOrder('asc');
              }}
              sx={{ color: '#f1f5f9' }}
            />
            <Chip
              label="Cost ($/1K)"
              variant={sortBy === 'cost' ? 'filled' : 'outlined'}
              onClick={() => {
                setSortBy('cost');
                setSortOrder('asc');
              }}
              sx={{ color: '#f1f5f9' }}
            />
          </Stack>

          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Showing <strong>{filteredPrompts.length}</strong> of {viewList.length} prompts
          </Typography>
        </Box>
      </Box>

      {/* Prompts Table */}
      <TableContainer component={Paper} className="glass-panel" sx={{ background: 'transparent' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: 'rgba(15, 23, 42, 0.9)' }}>
            <TableRow>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Task Group</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Tier</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>Tokens</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>Quality</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700, textAlign: 'center' }}>Efficiency (Q/Tk)</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Cost / 1K</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>Prompt Snippet</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrompts.map((prompt, index) => {
              const taskGroup = getTaskForPrompt(prompt.id);
              const tierColors = getTierColor(prompt.tier);
              const efficiency = calculateEfficiencyScore(prompt.quality_score, prompt.token_count);

              return (
                <TableRow
                  key={`${prompt.id}-${filterKey}`}
                  className="row-anim"
                  style={{ animationDelay: `${Math.min(index, 20) * 25}ms` }}
                  sx={{
                    transition: 'background-color 0.2s, box-shadow 0.2s',
                    '&:hover': { bgcolor: tierColors.bg, boxShadow: `inset 4px 0 0 ${tierColors.color}` },
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                      {taskGroup?.name || prompt.task_category}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'capitalize' }}>
                      {prompt.task_category}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={`${TIER_THEME[prompt.tier].emoji} ${prompt.tier}`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        bgcolor: tierColors.bg,
                        color: tierColors.color,
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                      {prompt.token_count}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                    <Chip
                      label={`${prompt.quality_score}/100`}
                      size="small"
                      sx={{
                        bgcolor: prompt.quality_score >= 90 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: prompt.quality_score >= 90 ? '#10b981' : '#eab308',
                        fontWeight: 700,
                      }}
                    />
                    <SourceBadge source={prompt.source} runs={prompt.runs} />
                    </Stack>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <Zap size={13} color="#10b981" />
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>
                        {efficiency}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 0.75, mx: 'auto', width: 70, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${(efficiency / maxEfficiency) * 100}%`, background: TIER_THEME[prompt.tier].gradient }} />
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#38bdf8' }}>
                      ${prompt.cost_per_1k_calls.toFixed(3)}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        color: '#cbd5e1',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {prompt.prompt_text}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        aria-label="Copy prompt"
                        onClick={() => copy(prompt.prompt_text, prompt.id)}
                        sx={{ color: copiedId === prompt.id ? '#10b981' : '#94a3b8' }}
                      >
                        {copiedId === prompt.id ? <Check size={16} /> : <Copy size={16} />}
                      </IconButton>
                      {taskGroup && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => onSelectTaskForComparison(taskGroup.id)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.15)', color: '#f1f5f9' }}
                        >
                          Compare 3 Tiers
                        </Button>
                      )}
                      {taskGroup && prompt.tier !== 'robust' && (
                        <IconButton
                          size="small"
                          aria-label="Diff against robust tier"
                          onClick={() => onOpenDiff(taskGroup.id, prompt.tier, 'robust')}
                          sx={{ color: '#94a3b8' }}
                        >
                          <GitCompare size={16} />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
