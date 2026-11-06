import React, { lazy, Suspense, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Container, LinearProgress } from '@mui/material';
import { Header } from './components/Header';
import { TierComparisonView } from './components/TierComparisonView';
import { LibraryCatalog } from './components/LibraryCatalog';
import { DiffViewer } from './components/DiffViewer';
import { CostCalculator } from './components/CostCalculator';
import { PromptDowngrader } from './components/PromptDowngrader';
import { Tier, TIERS } from './types/prompt';
import { EvalResultsProvider } from './state/evalResults';
import { ROUTES, useHashRoute } from './hooks/useHashRoute';
import { getTask } from './data/selectors';

// Live Eval pulls in the provider SDKs; load it only when the tab opens.
const LiveEval = lazy(() => import('./components/LiveEval').then((m) => ({ default: m.LiveEval })));

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0b0f19', paper: 'rgba(18, 24, 38, 0.75)' },
    primary: { main: '#10b981' },
    secondary: { main: '#3b82f6' },
    text: { primary: '#f8fafc', secondary: '#94a3b8' },
  },
  typography: { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  shape: { borderRadius: 12 },
});

const asTier = (v: string | undefined, fallback: Tier): Tier =>
  v && (TIERS as string[]).includes(v) ? (v as Tier) : fallback;

export const App: React.FC = () => {
  const { route, navigate } = useHashRoute();
  const { name, params } = route;
  const taskId = getTask(params.task).id;

  // Number keys 1-6 jump between tabs (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      const i = Number(e.key) - 1;
      if (i >= 0 && i < ROUTES.length) navigate(ROUTES[i], params.task ? { task: params.task } : {});
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, params.task]);

  const openDiff = (task: string, tierA: Tier, tierB: Tier) => navigate('diff', { task, a: tierA, b: tierB });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <EvalResultsProvider>
        <div className="aurora" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
        <Box sx={{ minHeight: '100vh', pb: 8 }}>
          <Header
            currentTab={ROUTES.indexOf(name)}
            onTabChange={(i) => navigate(ROUTES[i], params.task ? { task: params.task } : {})}
          />

          <Container maxWidth="xl" sx={{ mt: 3 }} key={name} className="page-enter">
            {name === 'compare' && (
              <TierComparisonView
                taskId={taskId}
                onTaskChange={(task) => navigate('compare', { task }, false)}
                onOpenDiff={openDiff}
              />
            )}
            {name === 'library' && (
              <LibraryCatalog
                onSelectTaskForComparison={(task) => navigate('compare', { task })}
                onOpenDiff={openDiff}
              />
            )}
            {name === 'diff' && (
              <DiffViewer
                taskId={taskId}
                tierA={asTier(params.a, 'standard')}
                tierB={asTier(params.b, 'robust')}
                onChange={(task, a, b) => navigate('diff', { task, a, b }, false)}
              />
            )}
            {name === 'cost' && (
              <CostCalculator taskId={taskId} onTaskChange={(task) => navigate('cost', { task }, false)} />
            )}
            {name === 'downgrade' && <PromptDowngrader />}
            {name === 'eval' && (
              <Suspense fallback={<LinearProgress sx={{ mt: 4 }} />}>
                <LiveEval />
              </Suspense>
            )}
          </Container>
        </Box>
      </EvalResultsProvider>
    </ThemeProvider>
  );
};

export default App;
