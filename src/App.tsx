import { AppRouter } from './app/router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
      <OfflineBanner />
    </ErrorBoundary>
  );
}

export default App;
