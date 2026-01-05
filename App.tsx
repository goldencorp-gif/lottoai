import React, { useState, useEffect } from 'react';
import { LotteryGameType, GameConfig } from './types';
import { GAME_CONFIGS } from './constants';
import CommercialNotice from './components/CommercialNotice';
import Navigation from './components/Navigation';
import PredictorView from './components/PredictorView';
import SimulatorView from './components/SimulatorView'; 
import GuideView from './components/GuideView';
import InputWizardView from './components/InputWizardView';
import LuckTesterView from './components/LuckTesterView';
import MoonBlocksView from './components/MoonBlocksView';
import LegalModal from './components/LegalModal';

type ViewType = 'predictor' | 'simulator' | 'guide' | 'wizard' | 'luck-tester' | 'moon-blocks';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('predictor');
  const [legalView, setLegalView] = useState<'privacy' | 'terms' | null>(null);

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

  // Persist State Changes
  useEffect(() => {
    localStorage.setItem('lotto_selected_game', selectedGame);
    localStorage.setItem('lotto_custom_params', JSON.stringify(customParams));
    localStorage.setItem('lotto_history_text', historyText);
    localStorage.setItem('lotto_lucky_numbers', luckyNumbersInput);
    localStorage.setItem('lotto_angel_input', angelInput);
  }, [selectedGame, customParams, historyText, luckyNumbersInput, angelInput]);

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
          />
        )}
        
        {currentView === 'simulator' && (
          <SimulatorView 
            selectedGame={selectedGame}
            historyText={historyText}
            customParams={customParams}
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

      {legalView && (
        <LegalModal 
          title={legalView === 'privacy' ? "Privacy Policy" : "Terms of Service"}
          onClose={() => setLegalView(null)}
          content={
            legalView === 'privacy' ? (
              <>
                <p><strong>1. Data Storage</strong><br/>AI Power Draw operates as a client-side simulation tool. All prediction data, user inputs, and history are stored locally on your device via browser LocalStorage. We do not maintain central servers to store your personal lottery data.</p>
                <p><strong>2. AI Processing</strong><br/>The application utilizes Google Gemini AI APIs for statistical analysis. Data sent to the AI API is processed subject to Google's data processing terms.</p>
              </>
            ) : (
              <>
                 <p><strong>1. Entertainment Purpose</strong><br/>AI Power Draw is strictly a mathematical simulation and analysis tool designed for entertainment and educational purposes regarding probability theory.</p>
                 <p><strong>2. No Guarantee of Winnings</strong><br/>Lottery games are games of chance. Past performance or statistical analysis cannot guarantee future results.</p>
              </>
            )
          }
        />
      )}
    </div>
  );
};

export default App;