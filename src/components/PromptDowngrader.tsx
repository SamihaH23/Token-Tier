import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Stack
} from '@mui/material';
import {
  Scissors,
  Zap,
  Check,
  Copy,
  Sparkles,
  Layers,
  AlertCircle
} from 'lucide-react';
import { estimateTokenCount, getTierFromTokenCount, detectCeremony, calculateEfficiencyScore } from '../utils/tokenizer';

export const PromptDowngrader: React.FC = () => {
  const [inputPrompt, setInputPrompt] = useState<string>(
    'You are a Senior Principal Technical Support Engineer evaluating enterprise customer tickets. Please carefully analyze the incoming support ticket provided below step by step. Make sure to output a clean, structured response in valid JSON format. Do not include any conversational preamble or pleasantries.'
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const tokenCount = estimateTokenCount(inputPrompt);
  const currentTier = getTierFromTokenCount(tokenCount);
  const ceremonyList = detectCeremony(inputPrompt);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Heuristic prompt downgraders
  const generateDowngradedStandard = (text: string): string => {
    let clean = text;
    // Strip common fluff phrases
    clean = clean.replace(/You are a [^.]+\./gi, '');
    clean = clean.replace(/You are an expert [^.]+\./gi, '');
    clean = clean.replace(/Please carefully analyze/gi, 'Analyze');
    clean = clean.replace(/Do not include any conversational preamble or pleasantries\./gi, 'Output JSON only.');
    clean = clean.replace(/step by step\.?/gi, '');
    return clean.trim() || 'Analyze input and return structured JSON.';
  };

  const generateDowngradedBare = (text: string): string => {
    let clean = text;
    clean = clean.replace(/You are [^.]+\./gi, '');
    clean = clean.replace(/Please carefully analyze the incoming support ticket provided below step by step\./gi, 'Summarize ticket:');
    clean = clean.replace(/Make sure to output a clean, structured response in valid JSON format\./gi, 'JSON format.');
    clean = clean.replace(/Do not include any conversational preamble or pleasantries\./gi, '');
    return 'Summarize ticket in JSON format:\n{{ticket_text}}';
  };

  const standardSuggestion = generateDowngradedStandard(inputPrompt);
  const bareSuggestion = generateDowngradedBare(inputPrompt);

  const standardTokens = estimateTokenCount(standardSuggestion);
  const bareTokens = estimateTokenCount(bareSuggestion);

  const standardSavings = Math.round(((tokenCount - standardTokens) / Math.max(1, tokenCount)) * 100);
  const bareSavings = Math.round(((tokenCount - bareTokens) / Math.max(1, tokenCount)) * 100);

  return (
    <Box sx={{ py: 3 }}>
      {/* Sandbox Header */}
      <Box className="glass-panel" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Scissors color="#10b981" size={24} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>
            Prompt Tokenizer & Ceremony Downgrader
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          Paste any verbose prompt below. We'll count exact tokens, flag unnecessary ceremony/filler, and automatically generate optimized Standard and Bare tier alternatives.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Input Prompt Panel */}
        <Grid item xs={12} md={6}>
          <Box className="glass-panel" sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                Your Custom Prompt Input
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={`${tokenCount} Tokens`}
                  color={tokenCount <= 30 ? 'success' : tokenCount <= 100 ? 'primary' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 800 }}
                />
                <Chip
                  label={currentTier.toUpperCase()}
                  variant="outlined"
                  size="small"
                  sx={{ color: '#cbd5e1', fontWeight: 700 }}
                />
              </Stack>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={8}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Paste your prompt text here..."
              sx={{
                bgcolor: 'rgba(8, 12, 20, 0.85)',
                borderRadius: '8px',
                mb: 2,
                textarea: { color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.9rem' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
              }}
            />

            {/* Detected Ceremony Tags */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 1 }}>
                Ceremony & Fluff Analysis:
              </Typography>
              {ceremonyList.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                  {ceremonyList.map((c, i) => (
                    <Chip
                      key={i}
                      label={`✂️ ${c}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="caption" sx={{ color: '#10b981', fontStyle: 'italic' }}>
                  ✓ Clean prompt! No common filler ceremony detected.
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>

        {/* Suggested Downgraded Tiers */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Standard Suggestion */}
            <Box className="glass-panel" sx={{ p: 3, borderLeft: '4px solid #3b82f6' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Standard Tier Suggestion" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 800 }} />
                  <Chip label={`-${standardSavings}% Tokens`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                </Box>

                <IconButton size="small" onClick={() => handleCopy(standardSuggestion, 'std-sug')} sx={{ color: '#94a3b8' }}>
                  {copiedId === 'std-sug' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </IconButton>
              </Box>

              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
                Estimated Tokens: <strong>{standardTokens} tk</strong> (vs {tokenCount} tk)
              </Typography>

              <Box className="prompt-code-block" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                {standardSuggestion}
              </Box>

              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Removes persona backstory and polite filler while preserving JSON format instructions.
              </Typography>
            </Box>

            {/* Bare Suggestion */}
            <Box className="glass-panel" sx={{ p: 3, borderLeft: '4px solid #10b981' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Bare Tier Suggestion" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800 }} />
                  <Chip label={`-${bareSavings}% Tokens`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                </Box>

                <IconButton size="small" onClick={() => handleCopy(bareSuggestion, 'bare-sug')} sx={{ color: '#94a3b8' }}>
                  {copiedId === 'bare-sug' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </IconButton>
              </Box>

              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>
                Estimated Tokens: <strong>{bareTokens} tk</strong> (vs {tokenCount} tk)
              </Typography>

              <Box className="prompt-code-block" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                {bareSuggestion}
              </Box>

              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Ultra-minimal prompt stripped down to core task input for high-volume pipelines.
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};
