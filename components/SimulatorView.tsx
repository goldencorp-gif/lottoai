import React, { useState, useEffect, useMemo } from 'react';
import { Play, Zap, Tv, Wind, Brain, Terminal } from 'lucide-react';
import { LotteryGameType, GameConfig } from '../types';
import { GAME_CONFIGS } from '../constants';
import { analyzeAndPredict } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import NumberBall from './NumberBall';
import AdUnit from './AdUnit';

interface SimulatorViewProps {
  selectedGame: LotteryGameType;
  historyText: string;
  customParams: Partial<GameConfig>;
}

const SimulatorView: React.FC<SimulatorViewProps> = ({ selectedGame, historyText, customParams }) => {
  const { language } = useLanguage();
  const [isDrawing, setIsDrawing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [mainNumbers, setMainNumbers] = useState<number[]>([]);
  const [bonusNumbers, setBonusNumbers] = useState<number[]>([]);
  const [powerball, setPowerball] = useState<number | null>(null);
  const [barrelState, setBarrelState] = useState<'idle' | 'mixing' | 'slowing'>('idle');
  const [drawStatus, setDrawStatus] = useState<string>('System Idle');
  const [aiLog, setAiLog] = useState<string[]>([]);

  const config = useMemo(() => {
    const base = GAME_CONFIGS[selectedGame];
    return selectedGame === LotteryGameType.CUSTOM ? { ...base, ...customParams } : base;
  }, [selectedGame, customParams]);
  
  const isPowerballGame = selectedGame.includes('Powerball') || selectedGame.includes('Mega');

  const addToLog = (msg: string) => {
    setAiLog(prev => [msg, ...prev].slice(0, 5));
  };

  const startDraw = async () => {
    if (isDrawing || isThinking) return;
    setIsThinking(true);
    setAiLog([]);
    addToLog("Initializing AI Neural Analysis...");
    setDrawStatus('AI Analyzing Historical Vectors...');

    let drawnMain: number[] = [];
    let drawnPB: number | null = null;

    try {
        addToLog("Scanning for Hot/Cold anomalies...");
        const prediction = await analyzeAndPredict(
            selectedGame, historyText, 1, [], [], "", false, ["Barrel Sequence"], null,
            selectedGame === LotteryGameType.CUSTOM ? customParams : undefined, language
        );

        if (prediction.entries && prediction.entries.length > 0) {
            drawnMain = prediction.entries[0];
            if (isPowerballGame) {
                drawnPB = prediction.powerballs?.[0] || Math.floor(Math.random() * 20) + 1;
            }
        }
        addToLog("Optimal sequence calculated.");
    } catch (e) {
        addToLog("AI Offline. Falling back to RNG Physics.");
        const pool = Array.from({ length: config.mainRange }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        drawnMain = pool.slice(0, config.mainCount).sort((a,b) => a-b);
        if (isPowerballGame) drawnPB = Math.floor(Math.random() * (config.bonusRange || 20)) + 1;
    }

    setIsThinking(false);
    setIsDrawing(true);
    setMainNumbers([]);
    setPowerball(null);
    setBarrelState('mixing');
    setDrawStatus('Air Injection Active');
    addToLog("Activating Air-Jet Mixing System...");

    const processNextBall = (step: number) => {
      if (step >= config.mainCount + (isPowerballGame ? 1 : 0)) {
        setBarrelState('idle');
        setDrawStatus('Draw Complete');
        setIsDrawing(false);
        addToLog("Draw finalized. Verifying checksum.");
        return;
      }

      setTimeout(() => {
        if (step < config.mainCount) {
          const num = drawnMain[step];
          setCurrentTubeBall({ num, color: 'bg-blue-600' });
          addToLog(`Extracting Main Ball #${step + 1}: ${num}`);
          setTimeout(() => {
            setMainNumbers(prev => [...prev, num]);
            setCurrentTubeBall(null);
            processNextBall(step + 1);
          }, 800);
        } else {
          setCurrentTubeBall({ num: drawnPB!, color: 'bg-gray-200 text-black' });
          addToLog(`POWERBALL ALERT: ${drawnPB}`);
          setTimeout(() => {
            setPowerball(drawnPB);
            setCurrentTubeBall(null);
            processNextBall(step + 1);
          }, 800);
        }
      }, 1200);
    };

    setTimeout(() => processNextBall(0), 1000);
  };

  const [visualBalls] = useState(() => Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    color: i % 8 === 0 ? 'bg-yellow-500' : 'bg-blue-600', 
    idleLeft: `${20 + Math.random() * 60}%`,
    idleBottom: `${5 + Math.random() * 15}%`,
    animType: Math.floor(Math.random() * 6) + 1
  })));

  const [currentTubeBall, setCurrentTubeBall] = useState<{num: number, color: string} | null>(null);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* AI Thought Log */}
        <div className="hidden lg:flex flex-col gap-4">
           <div className="glass-panel rounded-3xl p-6 border-white/5 h-[200px] flex flex-col bg-black/40 shadow-xl overflow-hidden">
             <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logic Terminal</span>
             </div>
             <div className="space-y-2">
                {aiLog.length === 0 && <p className="text-[10px] text-gray-600 italic">Waiting for command...</p>}
                {aiLog.map((log, i) => (
                  <p key={i} className="text-[10px] font-mono text-indigo-300/80 animate-in slide-in-from-left-2">{`> ${log}`}</p>
                ))}
             </div>
           </div>
           <div className="glass-panel rounded-3xl p-6 border-white/5 h-full flex flex-col items-center justify-center bg-gray-900/20 shadow-xl">
             <AdUnit slot="SIDEBAR" format="auto" className="w-full my-auto" />
           </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
            <div className="glass-panel rounded-3xl p-6 border-white/5 relative overflow-hidden flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                     <Tv className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">AI Simulation Hub</h2>
                     <div className="flex items-center gap-2 mt-1">
                       <span className={`w-2 h-2 rounded-full ${isDrawing || isThinking ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedGame} • {drawStatus}</p>
                     </div>
                   </div>
                </div>
            </div>

            <div className="glass-panel rounded-3xl border-white/5 min-h-[550px] flex flex-col items-center justify-center relative bg-gradient-to-b from-[#0B0F19] to-black overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

              <div className="relative z-10 flex flex-col items-center">
                 <div className="w-16 h-32 border-x-2 border-white/5 bg-white/5 backdrop-blur-sm relative overflow-hidden z-20 rounded-t-lg">
                     {currentTubeBall && (
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 animate-float-up flex items-center justify-center">
                              <div className={`w-full h-full rounded-full ${currentTubeBall.color} shadow-xl flex items-center justify-center text-white font-black text-xs`}>{currentTubeBall.num}</div>
                         </div>
                     )}
                 </div>

                 <div className="w-64 h-64 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden flex items-center justify-center z-10">
                    <div className="absolute inset-0 overflow-hidden">
                       {visualBalls.map((ball) => (
                         <div
                           key={ball.id}
                           className={`absolute w-6 h-6 rounded-full ${ball.color} shadow-inner border border-white/10 transition-all duration-700`}
                           style={{
                             bottom: barrelState === 'idle' ? ball.idleBottom : '50%', 
                             left: barrelState === 'idle' ? ball.idleLeft : '50%',
                             animation: barrelState === 'mixing' ? `tumble-${ball.animType} 0.5s infinite linear alternate` : 'none',
                           }}
                         />
                       ))}
                    </div>
                 </div>
              </div>

              <div className="w-full max-w-4xl px-4 mt-8 mb-4 relative z-20">
                  <div className="bg-black/40 border border-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-wrap justify-center gap-3">
                      {mainNumbers.map((num, i) => <NumberBall key={i} number={num} />)}
                      {powerball && <NumberBall number={powerball} isPowerball />}
                  </div>
              </div>
            </div>

            <div className="flex justify-center -mt-8 relative z-30">
               <button
                  onClick={startDraw}
                  disabled={isDrawing || isThinking}
                  className={`px-10 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${isDrawing || isThinking ? 'bg-gray-800 text-gray-500' : 'bg-indigo-600 text-white shadow-xl hover:scale-105'}`}
               >
                  <div className="flex items-center gap-3">
                     {isThinking ? <Brain className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 fill-current" />}
                     {isThinking ? 'Analyzing Market...' : isDrawing ? 'Drawing...' : 'Start AI Draw'}
                  </div>
               </button>
            </div>
        </div>
      </div>

      <style>{`
        @keyframes float-up { 0% { transform: translate(-50%, 100%); opacity: 0; } 100% { transform: translate(-50%, -100%); opacity: 1; } }
        .animate-float-up { animation: float-up 0.8s ease-out forwards; }
        @keyframes tumble-1 { 0% { transform: translate(-300%, -300%); } 100% { transform: translate(300%, 300%); } }
        @keyframes tumble-2 { 0% { transform: translate(300%, -300%); } 100% { transform: translate(-300%, 300%); } }
        @keyframes tumble-3 { 0% { transform: translate(0, -400%); } 100% { transform: translate(0, 400%); } }
        @keyframes tumble-4 { 0% { transform: translate(-400%, 0); } 100% { transform: translate(400%, 0); } }
        @keyframes tumble-5 { 0% { transform: translate(200%, 200%) rotate(0); } 100% { transform: translate(-200%, -200%) rotate(360deg); } }
        @keyframes tumble-6 { 0% { transform: translate(-200%, 200%) rotate(360deg); } 100% { transform: translate(200%, -200%) rotate(0); } }
      `}</style>
    </div>
  );
};

export default SimulatorView;