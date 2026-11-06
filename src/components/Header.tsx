import React from 'react';
import { Box, Container, Typography, Tabs, Tab, Chip, Stack, Tooltip } from '@mui/material';
import { Zap, Columns, Library, GitCompare, Calculator, Scissors, TrendingUp, FlaskConical } from 'lucide-react';
import { TASK_GROUPS } from '../data/prompts';
import { calculateEfficiencyScore } from '../utils/tokenizer';
import { useEvalResults } from '../state/evalResults';

interface HeaderProps {
  currentTab: number;
  onTabChange: (newTab: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const { viewList } = useEvalResults();
  const totalEfficiency = viewList.reduce(
    (acc, p) => acc + calculateEfficiencyScore(p.quality_score, p.token_count),
    0
  );
  const avgEfficiency = (totalEfficiency / viewList.length).toFixed(1);
  const measuredCount = viewList.filter((p) => p.source === 'measured').length;

  return (
    <Box 
      component="header" 
      sx={{ 
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        pt: 2.5,
        pb: 0,
      }}
    >
      <Container maxWidth="xl">
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            mb: 2.5
          }}
        >
          {/* Logo & Pitch */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #10b981 0%, #8b5cf6 60%, #ec4899 100%)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 0 24px rgba(139, 92, 246, 0.45)'
                }}
                className="float"
              >
                <Zap color="#ffffff" size={24} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: '#f8fafc' }}>
                Token<span className="gradient-text">Tier</span>
              </Typography>
              <Chip 
                label="v1.1" 
                size="small" 
                sx={{ 
                  height: 20, 
                  fontSize: '0.7rem', 
                  bgcolor: 'rgba(16, 185, 129, 0.15)', 
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 600
                }} 
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontSize: '0.9rem' }}>
              Prompt library ranked by <strong style={{ color: '#38bdf8' }}>Quality per Token</strong> across 3 budget tiers. Pick the cheapest prompt that hits your quality bar.
            </Typography>
          </Box>

          {/* Quick Metrics Bar */}
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5, '& > *': { ml: '0 !important' } }}>
            <Box 
              sx={{ 
                px: 2, 
                py: 1, 
                borderRadius: '10px', 
                bgcolor: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Library size={16} color="#94a3b8" />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1 }}>
                  Task Groups
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                  {TASK_GROUPS.length} Tasks ({viewList.length} Prompts)
                </Typography>
              </Box>
            </Box>

            <Box 
              sx={{ 
                px: 2, 
                py: 1, 
                borderRadius: '10px', 
                bgcolor: 'rgba(16, 185, 129, 0.08)', 
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <TrendingUp size={16} color="#10b981" />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1 }}>
                  Avg Efficiency
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10b981' }}>
                  {avgEfficiency} Score/Token
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1.2 }}>
                  {measuredCount}/{viewList.length} measured
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Navigation Tabs */}
        <Tooltip title={<span>Tip: press <kbd>1</kbd>–<kbd>6</kbd> to switch tabs</span>} placement="top-start" enterDelay={1200} enterNextDelay={1200}>
        <Tabs 
          value={currentTab} 
          onChange={(_, val) => onTabChange(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #10b981, #8b5cf6, #ec4899)',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              color: '#94a3b8',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              minHeight: 48,
              mr: 2,
              borderRadius: '10px 10px 0 0',
              transition: 'color 0.2s, background-color 0.2s',
              '& svg': { transition: 'transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1)' },
              '&.Mui-selected': {
                color: '#f8fafc',
              },
              '&.Mui-selected svg': { color: '#c4b5fd' },
              '&:hover': {
                color: '#f1f5f9',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
              },
              '&:hover svg': { transform: 'scale(1.2) rotate(-8deg)' },
            }
          }}
        >
          <Tab icon={<Columns size={18} />} iconPosition="start" label="Compare Tiers" />
          <Tab icon={<Library size={18} />} iconPosition="start" label="Library" />
          <Tab icon={<GitCompare size={18} />} iconPosition="start" label="Diff" />
          <Tab icon={<Calculator size={18} />} iconPosition="start" label="Cost" />
          <Tab icon={<Scissors size={18} />} iconPosition="start" label="Downgrader" />
          <Tab icon={<FlaskConical size={18} />} iconPosition="start" label="Live Eval" />
        </Tabs>
        </Tooltip>
      </Container>
    </Box>
  );
};
