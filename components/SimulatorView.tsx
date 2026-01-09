
import React, { useState, useMemo } from 'react';
import { Play, Tv, Brain, Terminal, Fan } from 'lucide-react';
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

type DrawStep = {
  type: 'MAIN' | 'SUPP' | 'PB';
  val: number;
};

const SimulatorView: React.FC<SimulatorViewProps> = ({ selectedGame, historyText, customParams }) => {
  const { language } = useLanguage();
  const [isDrawing, setIsDrawing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // Results State
  const [mainNumbers, setMainNumbers] = useState<number[]>([]);
  const [suppNumbers, setSuppNumbers] = useState<number[]>([]);
  const [pbNumbers, setPbNumbers] = useState<number[]>([]);
  
  const [barrelState, setBarrelState] = useState<'idle' | 'mixing' | 'slowing'>('idle');
  const [drawStatus, setDrawStatus] = useState<string>('System Idle');
  const [aiLog, setAiLog] = useState<string[]>([]);

  const config = useMemo(() => {
    const base = GAME_CONFIGS[selectedGame];
    return selectedGame === LotteryGameType.CUSTOM ? { ...base, ...customParams } : base;
  }, [selectedGame, customParams]);
  
  // Determine game structure robustly
  // Games with a 'bonusRange' usually imply a separate barrel (Powerball/Mega Millions).
  const isSeparateBarrel = config.bonusRange !== undefined && config.bonusRange > 0;
  
  // If we have separate barrel, bonusCount defines the PB count.
  const pbCount = isSeparateBarrel ? config.bonusCount : 0;

  // If we have explicit suppCount, use it.
  // Otherwise, if it's NOT a separate barrel game, the 'bonusCount' represents Supplementary numbers (Same Barrel).
  const suppCount = config.suppCount !== undefined 
      ? config.suppCount 
      : (!isSeparateBarrel ? config.bonusCount : 0);

  const addToLog = (msg: string) => {
    setAiLog(prev => [msg, ...prev].slice(0, 5));
  };

  const startDraw = async () => {
    if (isDrawing || isThinking) return;
    setIsThinking(true);
    setAiLog([]);
    addToLog("Initializing AI Neural Analysis...");
    setDrawStatus('AI Analyzing Historical Vectors...');
    
    // Log the configuration to ensure we know what we are drawing
    console.log(`Draw Config for ${selectedGame}: Main=${config.mainCount}, Supp=${suppCount}, PB=${pbCount}`);

    let sequence: DrawStep[] = [];

    try {
        addToLog("Scanning for Hot/Cold anomalies...");
        const prediction = await analyzeAndPredict(
            selectedGame, historyText, 1, [], [], "", false, ["Barrel Sequence"], null,
            selectedGame === LotteryGameType.CUSTOM ? customParams : undefined, language
        );

        let drawnMain: number[] = [];
        let drawnSupps: number[] = [];
        let drawnPBs: number[] = [];

        // 1. Main Numbers (From AI)
        if (prediction.entries && prediction.entries.length > 0) {
            drawnMain = prediction.entries[0];
            // SAFETY: Force slice to config.mainCount if not system entry (Simulator implies standard draw)
            if (drawnMain.length > config.mainCount) {
                drawnMain = drawnMain.slice(0, config.mainCount);
            }
        } else {
            // Fallback Main
            const pool = Array.from({ length: config.mainRange }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
            drawnMain = pool.slice(0, config.mainCount).sort((a,b) => a-b);
        }

        // 2. Supp Numbers (Same Barrel - Generated locally for Simulation)
        if (suppCount > 0) {
            // We need to pick supps from the REMAINING pool of the main range
            const pool = Array.from({ length: config.mainRange }, (_, i) => i + 1)
                              .filter(n => !drawnMain.includes(n)); // Exclude already drawn main
            // Randomly shuffle remaining
            const shuffled = pool.sort(() => Math.random() - 0.5);
            drawnSupps = shuffled.slice(0, suppCount).sort((a,b) => a-b);
            addToLog(`Allocating ${suppCount} Supplementary vectors...`);
        }

        // 3. PB Numbers (Separate Barrel)
        if (pbCount > 0) {
            if (prediction.powerballs && prediction.powerballs.length > 0) {
                // If AI provided enough PBs
                drawnPBs = prediction.powerballs.slice(0, pbCount);
            }
            
            // Fill remaining PBs if AI didn't provide enough (or any)
            if (drawnPBs.length < pbCount) {
                 const pbRange = config.bonusRange || 20;
                 const pbPool = Array.from({ length: pbRange }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
                 const needed = pbCount - drawnPBs.length;
                 const extras = pbPool.slice(0, needed);
                 drawnPBs = [...drawnPBs, ...extras];
            }
        }

        // Build full sequence
        // Order: Main -> Supps -> PBs
        drawnMain.forEach(n => sequence.push({ type: 'MAIN', val: n }));
        drawnSupps.forEach(n => sequence.push({ type: 'SUPP', val: n }));
        drawnPBs.forEach(n => sequence.push({ type: 'PB', val: n }));

        addToLog(`Sequence calculated: ${drawnMain.length} Main, ${drawnSupps.length} Supp, ${drawnPBs.length} PB.`);

    } catch (e) {
        addToLog("AI Offline. Falling back to RNG Physics.");
        // Full RNG Fallback
        const pool = Array.from({ length: config.mainRange }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        const mains = pool.slice(0, config.mainCount).sort((a,b) => a-b);
        const remaining = pool.slice(config.mainCount);
        
        const supps = suppCount > 0 ? remaining.slice(0, suppCount).sort((a,b) => a-b) : [];
        
        let pbs: number[] = [];
        if (pbCount > 0) {
             const pbRange = config.bonusRange || 20;
             const pbPool = Array.from({ length: pbRange }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
             pbs = pbPool.slice(0, pbCount);
        }

        mains.forEach(n => sequence.push({ type: 'MAIN', val: n }));
        supps.forEach(n => sequence.push({ type: 'SUPP', val: n }));
        pbs.forEach(n => sequence.push({ type: 'PB', val: n }));
    }

    setIsThinking(false);
    setIsDrawing(true);
    setMainNumbers([]);
    setSuppNumbers([]);
    setPbNumbers([]);
    setBarrelState('mixing');
    setDrawStatus('Chamber Pressurized');
    addToLog("Injecting High-Velocity Airflow...");

    const processSequence = (index: number) => {
      if (index >= sequence.length) {
        setBarrelState('idle');
        setDrawStatus('Draw Complete');
        setIsDrawing(false);
        addToLog("Sequence finalized. Verifying checksums.");
        return;
      }

      // Timing for Air-Jet Machine
      setTimeout(() => {
        const step = sequence[index];
        const ballTypeLabel = step.type === 'MAIN' ? `#${step.val}` : step.type === 'SUPP' ? `SUP ${step.val}` : `PB ${step.val}`;
        
        let ballColor = 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/50';
        if (step.type === 'SUPP') ballColor = 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-orange-500/50 text-gray-900';
        if (step.type === 'PB') ballColor = 'bg-gradient-to-br from-gray-100 to-white text-gray-900 shadow-white/50 border-gray-200';

        setCurrentTubeBall({ num: step.val, color: ballColor, label: step.type });
        addToLog(`Vacuum Capture: ${ballTypeLabel}`);
        
        // Ensure we update status to show we are in Supp/PB phase if applicable
        if (step.type === 'SUPP') setDrawStatus('Extracting Supplementary');
        if (step.type === 'PB') setDrawStatus('Extracting Powerball');

        setTimeout(() => {
          if (step.type === 'MAIN') setMainNumbers(prev => [...prev, step.val]);
          if (step.type === 'SUPP') setSuppNumbers(prev => [...prev, step.val]);
          if (step.type === 'PB') setPbNumbers(prev => [...prev, step.val]);
          
          setCurrentTubeBall(null);
          processSequence(index + 1);
        }, 1200); // Tube travel time
      }, 1600); // Interval between balls
    };

    setTimeout(() => processSequence(0), 2000); // Initial mix time
  };

  const [visualBalls] = useState(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    color: i % 3 === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : i % 2 === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-200 to-white text-gray-900', 
    idleLeft: `${10 + Math.random() * 80}%`,
    idleBottom: `${5 + Math.random() * 10}%`,
    animVar: Math.floor(Math.random() * 5) + 1, // 5 chaotic variations
    delay: Math.random() * 2 
  })));

  const [currentTubeBall, setCurrentTubeBall] = useState<{num: number, color: string, label: string} | null>(null);

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

            {/* MAIN MACHINE RENDER */}
            <div className="glass-panel rounded-3xl border-white/5 min-h-[550px] flex flex-col items-center justify-center relative bg-gradient-to-b from-[#0F172A] to-black overflow-hidden shadow-2xl">
              
              {/* Background Tech Mesh */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              <div className="absolute inset-0 bg-radial-gradient from-indigo-900/10 to-transparent"></div>

              {/* Machine Container */}
              <div className="relative z-10 flex flex-col items-center mt-8">
                 
                 {/* 1. Extraction Tube (Top) */}
                 <div className="w-24 h-32 border-x border-white/10 bg-white/5 backdrop-blur-sm relative overflow-hidden z-20 mb-[-10px] rounded-t-lg shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                     {/* Reflection streak */}
                     <div className="absolute top-0 right-2 w-1 h-full bg-white/10 blur-[1px]"></div>
                     
                     {/* Ball traveling up */}
                     {currentTubeBall && (
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 animate-vacuum-up flex items-center justify-center">
                              <div className={`w-full h-full rounded-full ${currentTubeBall.color} shadow-lg border border-white/20 flex items-center justify-center text-xs font-black`}>
                                {currentTubeBall.num}
                              </div>
                         </div>
                     )}
                 </div>

                 {/* 2. Main Mixing Chamber (Sphere) */}
                 <div className="w-80 h-80 rounded-full bg-gradient-to-br from-white/5 to-white/10 border-2 border-white/20 backdrop-blur-[2px] shadow-[inset_0_0_80px_rgba(255,255,255,0.05),0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden z-10">
                    
                    {/* Glass Glints */}
                    <div className="absolute top-10 left-12 w-20 h-10 bg-white/20 rounded-full blur-md -rotate-45 opacity-60 pointer-events-none"></div>
                    <div className="absolute bottom-10 right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>

                    {/* Balls */}
                    <div className="absolute inset-0 w-full h-full">
                       {visualBalls.map((ball) => (
                         <div
                           key={ball.id}
                           className={`
                             absolute w-8 h-8 rounded-full ${ball.color} shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-center
                             text-[8px] font-bold opacity-90 select-none
                           `}
                           style={{
                             // Chaotic Air-Jet Animation
                             animation: barrelState === 'mixing' 
                               ? `air-jet-chaos-${ball.animVar} ${0.8 + Math.random()}s infinite linear` 
                               : 'none',
                             animationDelay: `-${ball.delay}s`,
                             // Idle positioning (pile at bottom)
                             bottom: barrelState === 'idle' ? ball.idleBottom : 'unset',
                             left: barrelState === 'idle' ? ball.idleLeft : '50%',
                             // Transition setup
                             top: barrelState === 'mixing' ? '50%' : 'unset',
                             transform: barrelState === 'idle' ? 'translateX(-50%)' : 'translate(-50%, -50%)',
                             transition: 'bottom 0.5s ease-out'
                           }}
                         >
                           <span className={barrelState === 'mixing' ? 'blur-[1px]' : ''}></span>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* 3. Base / Fan Unit */}
                 <div className="w-64 h-20 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-3xl border-x border-b border-gray-700 shadow-2xl relative z-20 flex items-center justify-center mt-[-15px]">
                     {/* Fan Grille */}
                     <div className="w-12 h-12 rounded-full bg-black/50 border border-gray-600 flex items-center justify-center relative overflow-hidden">
                        <Fan className={`w-10 h-10 text-gray-400 ${barrelState === 'mixing' ? 'animate-spin-fast' : ''}`} />
                     </div>
                     
                     {/* Status Lights */}
                     <div className="absolute left-6 top-1/2 -translate-y-1/2 flex gap-2">
                        <div className={`w-2 h-2 rounded-full ${barrelState === 'mixing' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-900'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-yellow-500 animate-pulse' : 'bg-yellow-900'}`}></div>
                     </div>
                     
                     {/* Air Vents */}
                     <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                        <div className="w-10 h-0.5 bg-gray-600"></div>
                        <div className="w-10 h-0.5 bg-gray-600"></div>
                        <div className="w-10 h-0.5 bg-gray-600"></div>
                     </div>
                 </div>
              </div>

              {/* Result Tray */}
              <div className="w-full max-w-4xl px-4 mt-8 mb-4 relative z-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="bg-black/60 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center gap-4 shadow-2xl min-h-[100px]">
                      
                      {mainNumbers.length === 0 && suppNumbers.length === 0 && pbNumbers.length === 0 && (
                          <span className="text-gray-500 text-xs font-bold uppercase py-2 animate-pulse">Ready for extraction...</span>
                      )}

                      <div className="flex flex-wrap justify-center items-center gap-3">
                        {/* Main Numbers */}
                        {mainNumbers.map((num, i) => <NumberBall key={`m-${i}`} number={num} />)}
                        
                        {/* Supplementary Numbers (SUP) */}
                        {suppNumbers.length > 0 && (
                            <>
                                <div className="flex items-center px-2">
                                    <div className="h-8 w-px bg-white/10 mr-3"></div>
                                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mr-2">SUP</span>
                                </div>
                                {suppNumbers.map((num, i) => <NumberBall key={`s-${i}`} number={num} isBonus />)}
                            </>
                        )}

                        {/* Powerball Numbers (PB) */}
                        {pbNumbers.length > 0 && (
                            <>
                                <div className="flex items-center px-2">
                                    <div className="h-8 w-px bg-white/10 mr-3"></div>
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mr-2">PB</span>
                                </div>
                                {pbNumbers.map((num, i) => <NumberBall key={`p-${i}`} number={num} isPowerball />)}
                            </>
                        )}
                      </div>
                  </div>
              </div>

              {/* AD UNIT: MOBILE SIMULATOR */}
              {/* Visible only on mobile/tablet (hidden lg) where the sidebar ad is hidden */}
              <div className="lg:hidden w-full px-4 mb-8">
                 <AdUnit slot="SIDEBAR" format="horizontal" />
              </div>

            </div>

            <div className="flex justify-center -mt-8 relative z-30">
               <button
                  onClick={startDraw}
                  disabled={isDrawing || isThinking}
                  className={`px-10 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${isDrawing || isThinking ? 'bg-gray-800 text-gray-500' : 'bg-indigo-600 text-white shadow-xl hover:scale-105 shadow-indigo-600/30'}`}
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
        @keyframes vacuum-up {
           0% { transform: translate(-50%, 150%) scale(0.8); opacity: 0; }
           20% { opacity: 1; transform: translate(-50%, 100%) scale(1); }
           100% { transform: translate(-50%, -150%) scale(1); opacity: 1; }
        }
        .animate-vacuum-up { animation: vacuum-up 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

        .animate-spin-fast { animation: spin 0.2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Chaotic Center-Crossing Animations */
        
        @keyframes air-jet-chaos-1 {
          0% { transform: translate(-50%, -50%) translate3d(0, 100px, 0); }
          25% { transform: translate(-50%, -50%) translate3d(-100px, -80px, 0) rotate(120deg); }
          50% { transform: translate(-50%, -50%) translate3d(80px, 40px, 0) rotate(240deg); }
          75% { transform: translate(-50%, -50%) translate3d(-60px, 100px, 0) rotate(300deg); }
          100% { transform: translate(-50%, -50%) translate3d(0, 100px, 0) rotate(360deg); }
        }

        @keyframes air-jet-chaos-2 {
          0% { transform: translate(-50%, -50%) translate3d(0, 100px, 0); }
          20% { transform: translate(-50%, -50%) translate3d(100px, -100px, 0) rotate(-90deg); }
          40% { transform: translate(-50%, -50%) translate3d(-80px, 0px, 0) rotate(-180deg); }
          60% { transform: translate(-50%, -50%) translate3d(60px, 110px, 0) rotate(-270deg); }
          80% { transform: translate(-50%, -50%) translate3d(-20px, -50px, 0) rotate(-360deg); }
          100% { transform: translate(-50%, -50%) translate3d(0, 100px, 0) rotate(-400deg); }
        }

        @keyframes air-jet-chaos-3 {
          0% { transform: translate(-50%, -50%) translate3d(-40px, 100px, 0); }
          30% { transform: translate(-50%, -50%) translate3d(0, -110px, 0) rotate(180deg); } /* Straight up shot */
          60% { transform: translate(-50%, -50%) translate3d(90px, 50px, 0) rotate(270deg); }
          80% { transform: translate(-50%, -50%) translate3d(-90px, 50px, 0) rotate(320deg); }
          100% { transform: translate(-50%, -50%) translate3d(-40px, 100px, 0) rotate(360deg); }
        }

        @keyframes air-jet-chaos-4 {
           0% { transform: translate(-50%, -50%) translate3d(40px, 100px, 0); }
           25% { transform: translate(-50%, -50%) translate3d(-100px, -100px, 0) rotate(140deg); }
           50% { transform: translate(-50%, -50%) translate3d(100px, -80px, 0) rotate(220deg); }
           75% { transform: translate(-50%, -50%) translate3d(0, 120px, 0) rotate(280deg); }
           100% { transform: translate(-50%, -50%) translate3d(40px, 100px, 0) rotate(360deg); }
        }

        @keyframes air-jet-chaos-5 {
           0% { transform: translate(-50%, -50%) translate3d(0, 120px, 0); }
           15% { transform: translate(-50%, -50%) translate3d(80px, -20px, 0) rotate(60deg); }
           35% { transform: translate(-50%, -50%) translate3d(-80px, -60px, 0) rotate(140deg); }
           55% { transform: translate(-50%, -50%) translate3d(20px, 0px, 0) scale(1.3) rotate(200deg); } /* Center Hit */
           75% { transform: translate(-50%, -50%) translate3d(-50px, 100px, 0) rotate(300deg); }
           100% { transform: translate(-50%, -50%) translate3d(0, 120px, 0) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimulatorView;
