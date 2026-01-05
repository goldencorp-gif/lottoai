
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
import { Shield, Key } from 'lucide-react';

type ViewType = 'predictor' | 'simulator' | 'guide' | 'wizard' | 'luck-tester' | 'moon-blocks';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  const [currentView, setCurrentView] = useState<ViewType>('predictor');
  
  // Legal Modal State
  const [legalView, setLegalView] = useState<'privacy' | 'terms' | null>(null);
  
  // Global State - Default to USA Powerball for Global Audience
  const [selectedGame, setSelectedGame] = useState<LotteryGameType>(LotteryGameType.US_POWERBALL);
  const [customParams, setCustomParams] = useState<Partial<GameConfig>>({ mainCount: 6, mainRange: 45 });
  const [historyText, setHistoryText] = useState<string>('');
  const [luckyNumbersInput, setLuckyNumbersInput] = useState<string>('');
  const [angelInput, setAngelInput] = useState<string>('');

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if ((window as any).aistudio) {
          const hasSelected = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(hasSelected);
        } else {
          // In environments without the helper, we assume the key is possibly set via build
          // or we simply proceed and let the service handle the error.
          // However, to avoid "API Key Missing" error loops, we proceed.
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key status", e);
        setHasApiKey(true); // Fallback
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        // Assume success as per instructions to mitigate race condition
        setHasApiKey(true);
      } catch (e) {
        console.error("Error selecting API key", e);
      }
    }
  };

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

  if (isCheckingKey) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-gray-900 border border-white/10 rounded-3xl p-8 text-center shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
          
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
            <Shield className="w-10 h-10 text-indigo-400" />
          </div>

          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-3">Authentication Required</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              To use the Lotto AI prediction engine, you must connect a valid Google Gemini API Key.
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleSelectKey}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Key className="w-5 h-5" /> Select API Key
            </button>
            
            <p className="text-[10px] text-gray-500">
              This application requires a paid API key from a Google Cloud Project.<br/>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                View Billing Documentation
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
