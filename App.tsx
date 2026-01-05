
import React, { useState } from 'react';
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
  
  // Legal Modal State
  const [legalView, setLegalView] = useState<'privacy' | 'terms' | null>(null);
  
  // Global State - Default to USA Powerball for Global Audience
  const [selectedGame, setSelectedGame] = useState<LotteryGameType>(LotteryGameType.US_POWERBALL);
  const [customParams, setCustomParams] = useState<Partial<GameConfig>>({ mainCount: 6, mainRange: 45 });
  const [historyText, setHistoryText] = useState<string>('');
  const [luckyNumbersInput, setLuckyNumbersInput] = useState<string>('');
  const [angelInput, setAngelInput] = useState<string>('');

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

  // Determine the current game limit
  const currentGameConfig = selectedGame === LotteryGameType.CUSTOM 
    ? { ...GAME_CONFIGS[LotteryGameType.CUSTOM], ...customParams } 
    : GAME_CONFIGS[selectedGame];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-40">
      {/* Hide standard navigation when in specialized modes */}
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
          />
        )}

        {currentView === 'guide' && (
          <GuideView />
        )}

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

      {/* Legal Modals */}
      {legalView && (
        <LegalModal 
          title={legalView === 'privacy' ? "Privacy Policy" : "Terms of Service"}
          onClose={() => setLegalView(null)}
          content={
            legalView === 'privacy' ? (
              <>
                <p><strong>1. Data Storage</strong><br/>AI Power Draw operates as a client-side simulation tool. All prediction data, user inputs, and history are stored locally on your device via browser LocalStorage. We do not maintain central servers to store your personal lottery data.</p>
                <p><strong>2. AI Processing</strong><br/>The application utilizes Google Gemini AI APIs for statistical analysis. Data sent to the AI API is processed subject to Google's data processing terms but is not retained by the AI Power Draw developers. We advise against inputting personally identifiable information into the data fields.</p>
                <p><strong>3. Affiliate Tracking</strong><br/>Links to external retailers may contain affiliate tracking parameters. If you click these links, a cookie may be placed on your device by the retailer to attribute sales. This helps support our server costs.</p>
                <p><strong>4. Analytics</strong><br/>We may use anonymous usage analytics to improve application performance and fix bugs.</p>
              </>
            ) : (
              <>
                 <p><strong>1. Entertainment Purpose</strong><br/>AI Power Draw is strictly a mathematical simulation and analysis tool designed for entertainment and educational purposes regarding probability theory.</p>
                 <p><strong>2. No Guarantee of Winnings</strong><br/>Lottery games are games of chance. Past performance or statistical analysis cannot guarantee future results. This application makes no claims regarding the accuracy of its predictions for real-world gambling outcomes.</p>
                 <p><strong>3. Responsible Gambling</strong><br/>Users are solely responsible for their gambling decisions. We encourage responsible play. If gambling is causing you distress, please seek help via Gamble Aware.</p>
                 <p><strong>4. "As Is" Provision</strong><br/>The software is provided "as is" without warranty of any kind, express or implied.</p>
                 <p><strong>5. Age Restriction</strong><br/>You must be 18 years or older to use this application.</p>
              </>
            )
          }
        />
      )}
    </div>
  );
};

export default App;
