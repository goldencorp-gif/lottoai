
import React, { useState, useEffect } from 'react';
import { LotteryGameType, GameConfig, SavedPrediction } from './types';
import { GAME_CONFIGS, BUY_LINKS } from './constants';
import CommercialNotice from './components/CommercialNotice';
import Navigation from './components/Navigation';
import PredictorView from './components/PredictorView';
import SimulatorView from './components/SimulatorView'; 
import GuideView from './components/GuideView';
import InputWizardView from './components/InputWizardView';
import LuckTesterView from './components/LuckTesterView';
import MoonBlocksView from './components/MoonBlocksView';
import VaultView from './components/VaultView';
import LegalModal from './components/LegalModal';
import SettingsModal from './components/SettingsModal';
import SubscriptionModal from './components/SubscriptionModal';
import { ExternalLink, Ticket } from 'lucide-react';

type ViewType = 'predictor' | 'simulator' | 'guide' | 'wizard' | 'luck-tester' | 'moon-blocks' | 'vault';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('predictor');
  const [legalView, setLegalView] = useState<'privacy' | 'terms' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  // Initialize from LocalStorage
  const [selectedGame, setSelectedGame] = useState<LotteryGameType>(() => {
    const saved = localStorage.getItem('lotto_selected_game');
    return (saved as LotteryGameType) || LotteryGameType.US_POWERBALL;
  });

  const [customParams, setCustomParams] = useState<Partial<GameConfig>>(() => {
    const saved = localStorage.getItem('lotto_custom_params');
    return saved ? JSON.parse(saved) : { mainCount: 6, mainRange: 45 };
  });

  const [historyText, setHistoryText] = useState<string>(() => {
    return localStorage.getItem('lotto_history_text') || '';
  });

  const [luckyNumbersInput, setLuckyNumbersInput] = useState<string>(() => {
    return localStorage.getItem('lotto_lucky_numbers') || '';
  });

  const [angelInput, setAngelInput] = useState<string>(() => {
    return localStorage.getItem('lotto_angel_input') || '';
  });

  const [savedPredictions, setSavedPredictions] = useState<SavedPrediction[]>(() => {
    const saved = localStorage.getItem('lotto_vault');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist State Changes
  useEffect(() => {
    localStorage.setItem('lotto_selected_game', selectedGame);
    localStorage.setItem('lotto_custom_params', JSON.stringify(customParams));
    localStorage.setItem('lotto_history_text', historyText);
    localStorage.setItem('lotto_lucky_numbers', luckyNumbersInput);
    localStorage.setItem('lotto_angel_input', angelInput);
    localStorage.setItem('lotto_vault', JSON.stringify(savedPredictions));
  }, [selectedGame, customParams, historyText, luckyNumbersInput, angelInput, savedPredictions]);

  const handleWizardComplete = (data: string) => {
    setHistoryText(data);
    setCurrentView('predictor');
  };

  const handleAddLuckyNumber = (num: number) => {
    const current = luckyNumbersInput.split(/[\s,]+/).filter(n => n.trim() !== '');
    if (!current.includes(num.toString())) {
      const newVal = current.length > 0 ? `${luckyNumbersInput}, ${num}` : `${num}`;
      setLuckyNumbersInput(newVal);
    }
    setCurrentView('predictor');
  };

  const handleSaveToVault = (prediction: SavedPrediction) => {
    setSavedPredictions(prev => [prediction, ...prev]);
  };

  const handleDeleteFromVault = (id: string) => {
    setSavedPredictions(prev => prev.filter(p => p.id !== id));
  };

  const isFullScreenView = currentView === 'wizard' || currentView === 'luck-tester' || currentView === 'moon-blocks';

  const currentGameConfig = selectedGame === LotteryGameType.CUSTOM 
    ? { ...GAME_CONFIGS[LotteryGameType.CUSTOM], ...customParams } 
    : GAME_CONFIGS[selectedGame];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-40">
      {!isFullScreenView && (
        <Navigation 
          currentView={currentView} 
          setView={setCurrentView} 
          onOpenSettings={() => setShowSettings(true)}
          onOpenSubscribe={() => setShowSubscription(true)}
        />
      )}

      <main className="min-h-[80vh]">
        {currentView === 'predictor' && (
          <PredictorView 
            selectedGame={selectedGame}
            setSelectedGame={setSelectedGame}
            customParams={customParams}
            setCustomParams={setCustomParams}
            historyText={historyText}
            onOpenDataWizard={() => setCurrentView('wizard')}
            luckyNumbersInput={luckyNumbersInput}
            setLuckyNumbersInput={setLuckyNumbersInput}
            angelInput={angelInput}
            setAngelInput={setAngelInput}
            onTestLuck={() => setCurrentView('luck-tester')}
            onTestMoon={() => setCurrentView('moon-blocks')}
            onSaveToVault={handleSaveToVault}
          />
        )}
        
        {currentView === 'simulator' && (
          <SimulatorView 
            selectedGame={selectedGame}
            historyText={historyText}
            customParams={customParams}
          />
        )}

        {currentView === 'vault' && (
          <VaultView 
            entries={savedPredictions}
            onDelete={handleDeleteFromVault}
            onImport={setSavedPredictions}
          />
        )}

        {currentView === 'guide' && <GuideView />}

        {currentView === 'wizard' && (
          <InputWizardView 
            game={selectedGame}
            currentData={historyText}
            onSave={handleWizardComplete}
            onCancel={() => setCurrentView('predictor')}
          />
        )}

        {currentView === 'luck-tester' && (
          <LuckTesterView
            limit={currentGameConfig.mainRange}
            onBack={() => setCurrentView('predictor')}
            onConfirmLucky={handleAddLuckyNumber}
          />
        )}

        {currentView === 'moon-blocks' && (
          <MoonBlocksView
            limit={currentGameConfig.mainRange}
            onBack={() => setCurrentView('predictor')}
            onConfirmLucky={handleAddLuckyNumber}
          />
        )}
      </main>

      {!isFullScreenView && (
        <CommercialNotice 
          onOpenPrivacy={() => setLegalView('privacy')}
          onOpenTerms={() => setLegalView('terms')}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      
      {showSubscription && (
        <SubscriptionModal onClose={() => setShowSubscription(false)} />
      )}

      {legalView && (
        <LegalModal 
          title={legalView === 'privacy' ? "Privacy Policy" : "Terms of Service"}
          onClose={() => setLegalView(null)}
          content={
            legalView === 'privacy' ? (
              <>
                <p><strong>1. Data Storage</strong><br/>All prediction data, user inputs, and history are stored locally on your device via browser LocalStorage.</p>
                <p><strong>2. AI Processing</strong><br/>The application utilizes Google Gemini AI APIs. Data sent to the AI API is processed subject to Google's data processing terms.</p>
                <p><strong>3. API Keys</strong><br/>If you provide your own API Key, it is stored locally on your device and sent directly to Google. We do not store or track your API key.</p>
              </>
            ) : (
              <>
                 <p><strong>1. Entertainment Purpose</strong><br/>AI Power Draw is strictly a mathematical simulation and analysis tool for entertainment purposes.</p>
                 <p><strong>2. No Guarantee of Winnings</strong><br/>Lottery games are based on random chance. Past performance cannot guarantee future results.</p>
              </>
            )
          }
        />
      )}

      {/* Sticky Affiliate Footer for High Conversion */}
      {!isFullScreenView && BUY_LINKS[selectedGame] && (
         <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-indigo-500/30 p-4 z-[90] pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
             <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                      <Ticket className="w-5 h-5 text-white" />
                   </div>
                   <div className="hidden sm:block">
                      <div className="text-xs text-gray-400 font-bold uppercase">Ready to Win?</div>
                      <div className="text-sm font-black text-white uppercase tracking-tight">Play {selectedGame} Online</div>
                   </div>
                </div>
                <a 
                   href={BUY_LINKS[selectedGame]} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                >
                   Bet Now <ExternalLink className="w-3 h-3" />
                </a>
             </div>
         </div>
      )}
    </div>
  );
};

export default App;
