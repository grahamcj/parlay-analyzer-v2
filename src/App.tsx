import { useEffect } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { useDataStore } from './store/dataStore';
import GameList from './components/GameList/GameList';
import BetAnalysis from './components/BetAnalysis/BetAnalysis';
import SavedParlays from './components/SavedParlays/SavedParlays';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorScreen from './components/common/ErrorScreen';
import './App.css';

function App() {
  const { isLoading, error, loadData } = useDataStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={loadData} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/game/:gameId" element={<BetAnalysis />} />
          <Route path="/saved" element={<SavedParlays />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;