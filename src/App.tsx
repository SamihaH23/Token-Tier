import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Container } from '@mui/material';
import { Header } from './components/Header';
import { TierComparisonView } from './components/TierComparisonView';
import { LibraryCatalog } from './components/LibraryCatalog';
import { DiffViewer } from './components/DiffViewer';
import { CostCalculator } from './components/CostCalculator';
import { PromptDowngrader } from './components/PromptDowngrader';
import { Tier } from './types/prompt';

// MUI Dark Theme configuration matching TokenTier design tokens
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0b0f19',
      paper: 'rgba(18, 24, 38, 0.75)',
    },
    primary: {
      main: '#10b981', // Emerald
    },
    secondary: {
      main: '#3b82f6', // Blue
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
});

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [diffParams, setDiffParams] = useState<{ taskId?: string; tierA?: Tier; tierB?: Tier }>({});

  const handleOpenDiff = (taskId: string, tierA: Tier, tierB: Tier) => {
    setDiffParams({ taskId, tierA, tierB });
    setCurrentTab(2); // Jump to Text Diff Engine tab
  };

  const handleSelectTaskForComparison = (taskId: string) => {
    setCurrentTab(0); // Jump to 3-Tier Comparison View tab
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', pb: 8 }}>
        <Header currentTab={currentTab} onTabChange={setCurrentTab} />

        <Container maxWidth="xl" sx={{ mt: 3 }}>
          {currentTab === 0 && <TierComparisonView onOpenDiff={handleOpenDiff} />}
          {currentTab === 1 && (
            <LibraryCatalog
              onSelectTaskForComparison={handleSelectTaskForComparison}
              onOpenDiff={handleOpenDiff}
            />
          )}
          {currentTab === 2 && (
            <DiffViewer
              initialTaskId={diffParams.taskId}
              initialTierA={diffParams.tierA}
              initialTierB={diffParams.tierB}
            />
          )}
          {currentTab === 3 && <CostCalculator />}
          {currentTab === 4 && <PromptDowngrader />}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
