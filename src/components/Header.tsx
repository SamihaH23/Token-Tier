import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Chip, 
  Stack, 
  useTheme 
} from '@mui/material';
import { 
  Zap, 
  Columns, 
  Library, 
  GitCompare, 
  Calculator, 
  Scissors,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { PROMPTS, TASK_GROUPS } from '../data/prompts';
import { calculateEfficiencyScore } from '../utils/tokenizer';

interface HeaderProps {
  currentTab: number;
  onTabChange: (newTab: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const theme = useTheme();

  // Calculate average library efficiency score
  const totalEfficiency = PROMPTS.reduce(
    (acc, p) => acc + calculateEfficiencyScore(p.quality_score, p.token_count),
    0
  );
  const avgEfficiency = (totalEfficiency / PROMPTS.length).toFixed(1);

  return (
    <Box 
      component="header" 
      sx={{ 
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        sticky: 'top',
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
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Zap color="#ffffff" size={24} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: '#f8fafc' }}>
                Token<span style={{ color: '#10b981' }}>Tier</span>
              </Typography>
              <Chip 
                label="v1.0 MVP" 
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
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
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
                  {TASK_GROUPS.length} Tasks ({PROMPTS.length} Prompts)
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
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Navigation Tabs */}
        <Tabs 
          value={currentTab} 
          onChange={(_, val) => onTabChange(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            '& .MuiTabs-indicator': {
              backgroundColor: '#10b981',
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
              '&.Mui-selected': {
                color: '#f8fafc',
              },
              '&:hover': {
                color: '#cbd5e1',
              }
            }
          }}
        >
          <Tab icon={<Columns size={18} />} iconPosition="start" label="Tier Comparison View" />
          <Tab icon={<Library size={18} />} iconPosition="start" label="Library Catalog & Efficiency Rank" />
          <Tab icon={<GitCompare size={18} />} iconPosition="start" label="Text Diff Engine" />
          <Tab icon={<Calculator size={18} />} iconPosition="start" label="Cost Calculator" />
          <Tab icon={<Scissors size={18} />} iconPosition="start" label="Prompt Tokenizer & Downgrader" />
        </Tabs>
      </Container>
    </Box>
  );
};
