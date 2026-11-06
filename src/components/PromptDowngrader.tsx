import React, { useRef, useState } from 'react';
import { Box, Chip, Grid, IconButton, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { Check, Copy, Scissors, Wand2 } from 'lucide-react';
import { estimateTokenCount, getTierFromTokenCount } from '../utils/tokenizer';
import { detectCeremony, downgradePrompt } from '../utils/downgrader';
import { computeTextDiff } from '../utils/diffHelper';
import { useCopy } from '../hooks/useCopy';
import { useEvalResults } from '../state/evalResults';
import { TIER_THEME } from '../theme/tiers';
import { AnimatedNumber } from './fx/AnimatedNumber';
import { burstFrom } from './fx/celebrate';

const EXAMPLES = [
  {
    label: '🎩 Overdressed support bot',
    text: 'You are a Senior Principal Technical Support Engineer evaluating enterprise customer tickets. Please carefully analyze the incoming support ticket provided below step by step. Make sure to output a clean, structured response in valid JSON format. Do not include any conversational preamble or pleasantries.\n\n{{ticket}}',
  },
  {
    label: '🧑‍🍳 Fancy chef',
    text: 'You are a world-class Michelin star chef. Take a deep breath and think step by step. I would like you to kindly write a very detailed recipe for {{dish}}. Make sure to format your answer nicely. Remember to output the ingredients as bullet points.',
  },
  {
    label: '📜 Legal eagle',
    text: 'You are an expert corporate lawyer with 30 years of experience. Your task is to carefully review the following contract clause and summarize the obligations of each party. Do not include any explanations of legal theory.\n\nClause: {{clause}}',
  },
  {
    label: '🙏 Extremely polite',
    text: 'Could you please kindly translate the following text into French? This is really important to me. Please make sure to be very accurate.\n\n{{text}}',
  },
];

type Mode = 'standard' | 'bare';

export const PromptDowngrader: React.FC = () => {
  const [inputPrompt, setInputPrompt] = useState<string>(EXAMPLES[0].text);
  const [mode, setMode] = useState<Mode>('bare');
  const copyBtn = useRef<HTMLButtonElement>(null);
  const { copiedId, copy } = useCopy(() => burstFrom(copyBtn.current, 22));
  const { tokenizerReady } = useEvalResults(); // re-render with exact counts once loaded

  const tokenCount = estimateTokenCount(inputPrompt);
  const currentTier = getTierFromTokenCount(tokenCount);
  const ceremonyList = detectCeremony(inputPrompt);
  const results = { standard: downgradePrompt(inputPrompt, 'standard'), bare: downgradePrompt(inputPrompt, 'bare') };
  const tokens = { standard: estimateTokenCount(results.standard.text), bare: estimateTokenCount(results.bare.text) };
  const savings = (t: number) => Math.max(0, Math.round(((tokenCount - t) / Math.max(1, tokenCount)) * 100));
  const fluff = savings(tokens.bare);
  const selected = results[mode];
  const diff = computeTextDiff(inputPrompt, selected.text);
  const theme = TIER_THEME[mode];

  const fluffMood = fluff >= 60 ? '🤯 Wildly overdressed' : fluff >= 35 ? '😬 Pretty fluffy' : fluff >= 10 ? '🙂 A little padding' : '✨ Already lean';

  const bars = [
    { label: 'Original', value: tokenCount, gradient: 'linear-gradient(90deg, #ef4444, #f97316)' },
    { label: `${TIER_THEME.standard.emoji} Standard`, value: tokens.standard, gradient: TIER_THEME.standard.gradient },
    { label: `${TIER_THEME.bare.emoji} Bare`, value: tokens.bare, gradient: TIER_THEME.bare.gradient },
  ];

  return (
    <Box sx={{ py: 3 }}>
      <Box className="glass-panel" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Scissors color="#ec4899" size={24} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Prompt <span className="gradient-text">Downgrader</span>
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
          Paste a prompt and watch the ceremony get snipped. Tokens are counted with o200k (exact for OpenAI, close for Claude and
          Gemini).
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, mr: 0.5 }}>
            TRY:
          </Typography>
          {EXAMPLES.map((ex) => (
            <Chip
              key={ex.label}
              label={ex.label}
              onClick={(e) => {
                setInputPrompt(ex.text);
                burstFrom(e.currentTarget, 12);
              }}
              variant={inputPrompt === ex.text ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 600,
                transition: 'transform 0.2s',
                borderColor: 'rgba(236,72,153,0.4)',
                ...(inputPrompt === ex.text && { bgcolor: 'rgba(236,72,153,0.2)', color: '#fbcfe8' }),
                '&:hover': { transform: 'translateY(-2px) scale(1.03)' },
              }}
            />
          ))}
        </Stack>
      </Box>

      <Grid container spacing={3} className="stagger">
        {/* Input */}
        <Grid item xs={12} md={6}>
          <Box className="glass-panel" sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Your prompt
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={
                    <>
                      {tokenizerReady ? '' : '~'}
                      <AnimatedNumber value={tokenCount} duration={300} /> tokens
                    </>
                  }
                  size="small"
                  sx={{ fontWeight: 800, bgcolor: TIER_THEME[currentTier].soft, color: TIER_THEME[currentTier].color }}
                />
                <Chip
                  label={`${TIER_THEME[currentTier].emoji} ${TIER_THEME[currentTier].name}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700, borderColor: TIER_THEME[currentTier].color, color: TIER_THEME[currentTier].color }}
                />
              </Stack>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={8}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Paste your prompt here…"
              inputProps={{ 'aria-label': 'Prompt to downgrade' }}
              sx={{
                bgcolor: 'rgba(8, 12, 20, 0.85)',
                borderRadius: '8px',
                mb: 2.5,
                textarea: { color: '#f8fafc', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ec4899 !important' },
              }}
            />

            {/* Fluff meter */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                  FLUFF METER · {fluffMood}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#fbcfe8' }}>
                  <AnimatedNumber value={fluff} />%
                </Typography>
              </Box>
              <Box sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <Box
                  className="grow-bar shine"
                  sx={{ height: '100%', width: `${fluff}%`, borderRadius: 5, background: 'linear-gradient(90deg, #f59e0b, #ec4899, #8b5cf6)' }}
                />
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 1 }}>
              CEREMONY SPOTTED
            </Typography>
            {ceremonyList.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {ceremonyList.map((c, i) => (
                  <Chip
                    key={c}
                    className="row-anim"
                    style={{ animationDelay: `${i * 60}ms` }}
                    label={`✂️ ${c}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600 }}
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" sx={{ color: '#10b981', fontStyle: 'italic' }}>
                ✓ Clean prompt — no common ceremony detected.
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Output */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <Box className="glass-panel" sx={{ p: 3 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 1.5 }}>
                TOKEN RACE
              </Typography>
              <Stack spacing={1.25}>
                {bars.map((b) => (
                  <Box key={b.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ width: 92, flexShrink: 0, color: '#cbd5e1', fontWeight: 600 }}>
                      {b.label}
                    </Typography>
                    <Box sx={{ flex: 1, height: 14, borderRadius: 7, bgcolor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <Box
                        className="grow-bar"
                        sx={{ height: '100%', borderRadius: 7, background: b.gradient, width: `${Math.max(2, (b.value / Math.max(1, tokenCount)) * 100)}%` }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ width: 44, textAlign: 'right', fontWeight: 800 }}>
                      <AnimatedNumber value={b.value} duration={400} />
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box className="glass-panel tier-card" sx={{ p: 3, flex: 1, borderLeft: `4px solid ${theme.color}` }} style={{ ['--tier' as string]: theme.color, ['--tier-glow' as string]: theme.glow }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={mode}
                  onChange={(_, v: Mode | null) => v && setMode(v)}
                  sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, px: 1.5, color: '#94a3b8' } }}
                >
                  {(['standard', 'bare'] as Mode[]).map((m) => (
                    <ToggleButton
                      key={m}
                      value={m}
                      sx={{ '&.Mui-selected': { color: TIER_THEME[m].color, bgcolor: `${TIER_THEME[m].soft} !important` } }}
                    >
                      {TIER_THEME[m].emoji} {TIER_THEME[m].name} · −{savings(tokens[m])}%
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Tooltip title={copiedId === mode ? 'Copied!' : 'Copy suggestion'}>
                  <IconButton
                    ref={copyBtn}
                    size="small"
                    aria-label={`Copy ${mode} suggestion`}
                    onClick={() => void copy(selected.text, mode)}
                    sx={{ color: copiedId === mode ? '#10b981' : '#94a3b8', '&:hover': { color: theme.color, transform: 'scale(1.15)' }, transition: 'transform 0.2s' }}
                  >
                    {copiedId === mode ? <Check size={16} /> : <Copy size={16} />}
                  </IconButton>
                </Tooltip>
              </Box>

              <Box className="prompt-code-block" sx={{ mb: 2, borderColor: `${theme.color}55` }}>
                {selected.text}
              </Box>

              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                <Wand2 size={13} /> WHAT GOT CUT
              </Typography>
              <Box className="prompt-code-block" key={selected.text} sx={{ fontSize: '0.8rem', maxHeight: 180, overflowY: 'auto', mb: 1.5 }}>
                {diff.map((part, i) =>
                  part.removed ? (
                    <span key={i} className="diff-removed" style={{ animationDelay: `${Math.min(i, 30) * 25}ms` }}>
                      {part.value}
                    </span>
                  ) : part.added ? (
                    <span key={i} className="diff-added" style={{ animationDelay: `${Math.min(i, 30) * 25}ms` }}>
                      {part.value}
                    </span>
                  ) : (
                    <span key={i} style={{ color: '#94a3b8' }}>
                      {part.value}
                    </span>
                  )
                )}
              </Box>

              {selected.applied.length > 0 ? (
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {selected.applied.map((label) => (
                    <Chip key={label} label={label} size="small" sx={{ height: 20, fontSize: '0.66rem', bgcolor: theme.soft, color: theme.color }} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  No rules matched — this prompt is already lean for this tier.
                </Typography>
              )}
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};
