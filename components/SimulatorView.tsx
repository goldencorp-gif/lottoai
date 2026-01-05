import React, { useState, useEffect } from 'react';
import { Play, Zap, Tv, Wind } from 'lucide-react';
import { LotteryGameType } from '../types';
import { GAME_CONFIGS } from '../constants';
import NumberBall from './NumberBall';
import AdUnit from './AdUnit';

interface SimulatorViewProps {
  selectedGame: LotteryGameType;
}

const SimulatorView: React.FC<SimulatorViewProps> = ({ selectedGame }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [mainNumbers, setMainNumbers] = useState<number[]>([]);
  const [bonusNumbers, setBonusNumbers] = useState<number[]>([]);
  const [powerball, setPowerball] = useState<number | null>(null);
  const [barrelState, setBarrelState] = useState<'idle' | 'mixing' | 'slowing'>('idle');
  const [drawStatus, setDrawStatus] = useState<string>('Ready to Initialize');
  
  // Visual simulation state
  const [visualBalls, setVisualBalls] = useState<any[]>([]);
  const [currentTubeBall, setCurrentTubeBall] = useState<{num: number, color: string} | null>(null);

  const config = GAME_CONFIGS[selectedGame];
  
  // Detect games that use a separate powerball drum
  const isPowerballGame = 
    selectedGame === LotteryGameType.US_POWERBALL || 
    selectedGame === LotteryGameType.US_MEGA_MILLIONS || 
    selectedGame === LotteryGameType.LA_PRIMITIVA;

  // Initialize the visual balls that will bounce around
  useEffect(() => {
    const balls = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      // Distribute colors roughly according to game type (e.g. mostly blue, some yellow for powerball)
      color: i % 8 === 0 ? 'bg-yellow-500' : 'bg-blue-600', 
      // Random start positions for idle pile
      idleLeft: `${20 + Math.random() * 60}%`,
      idleBottom: `${5 + Math.random() * 15}%`, 
      idleRotate: `${Math.random() * 360}deg`,
      // Animation properties
      animType: Math.floor(Math.random() * 6) + 1, // 1-6 tumble patterns for more variety
      animDuration: `${0.3 + Math.random() * 0.5}s`, // Faster pacing
      animDelay: `-${Math.random()}s` // Negative delay to start mid-animation
    }));
    setVisualBalls(balls);
  }, [selectedGame]);

  const startDraw = () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setMainNumbers([]);
    setBonusNumbers([]);
    setPowerball(null);
    setBarrelState('mixing');
    setDrawStatus('Air Mix Injection Active...');

    // Logic to generate the full result first
    const pool = Array.from({ length: config.mainRange }, (_, i) => i + 1);
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const drawnMain = shuffled.slice(0, config.mainCount).sort((a, b) => a - b);
    const drawnBonus = shuffled.slice(config.mainCount, config.mainCount + config.bonusCount).sort((a, b) => a - b);
    
    let drawnPB: number | null = null;
    if (isPowerballGame) {
      drawnPB = Math.floor(Math.random() * (config.bonusRange || 20)) + 1;
    }

    // Animation Sequence
    const totalSteps = config.mainCount + config.bonusCount + (isPowerballGame ? 1 : 0);
    
    const processNextBall = (currentStep: number) => {
      if (currentStep >= totalSteps) {
        setBarrelState('idle');
        setDrawStatus('Draw Complete - Official Results Pending');
        setIsDrawing(false);
        return;
      }

      // 1. Select the number for this step
      let nextNum = 0;
      let type: 'main' | 'bonus' | 'powerball' = 'main';

      if (currentStep < config.mainCount) {
        nextNum = drawnMain[currentStep];
        setDrawStatus(`Extracting Main Ball ${currentStep + 1}...`);
      } else if (currentStep < config.mainCount + config.bonusCount) {
        nextNum = drawnBonus[currentStep - config.mainCount];
        type = 'bonus';
        setDrawStatus('Extracting Supplement...');
      } else {
        nextNum = drawnPB!;
        type = 'powerball';
        setDrawStatus('POWERBALL SEQUENCE');
      }

      // 2. Animate Ball entering tube
      let colorClass = 'bg-gradient-to-br from-blue-500 to-blue-700';
      if (type === 'bonus') colorClass = 'bg-gradient-to-br from-yellow-400 to-yellow-600';
      if (type === 'powerball') colorClass = 'bg-gradient-to-br from-gray-200 to-gray-400 text-black';

      setCurrentTubeBall({ num: nextNum, color: colorClass });
      
      // 3. Wait for tube animation, then add to tray
      setTimeout(() => {
        // Add to respective state
        if (type === 'main') setMainNumbers(prev => [...prev, nextNum]);
        else if (type === 'bonus') setBonusNumbers(prev => [...prev, nextNum]);
        else if (type === 'powerball') setPowerball(nextNum);

        setCurrentTubeBall(null); // Clear tube

        // 4. Wait a bit before next ball
        setTimeout(() => {
          processNextBall(currentStep + 1);
        }, 1500);

      }, 800); // Tube travel time
    };

    // Initial mixing time before first draw
    setTimeout(() => {
        processNextBall(0);
    }, 2500);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar - Sponsored Area (Desktop) */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-6">
            <div className="glass-panel rounded-3xl p-6 border-white/5 h-full flex flex-col items-center justify-center bg-gray-900/20 shadow-xl">
                 <div className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-8 text-center w-full border-b border-gray-800 pb-2">
                    Sponsored Partner
                 </div>
                 <AdUnit slot="SIDEBAR" format="auto" className="w-full my-auto" />
                 <div className="text-[9px] text-gray-700 text-center mt-8">
                    Ads help support our server costs.
                 </div>
            </div>
        </div>

        {/* Main Simulator Content */}
        <div className="lg:col-span-3 space-y-6">
            
            {/* TV Studio Header */}
            <div className="glass-panel rounded-3xl p-6 border-white/5 relative overflow-hidden flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 border border-white/10">
                     <Tv className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Live Draw Engine</h2>
                     <div className="flex items-center gap-2 mt-1">
                       <span className={`w-2 h-2 rounded-full ${isDrawing ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {selectedGame} • {drawStatus}
                       </p>
                     </div>
                   </div>
                </div>
                
                {/* Ambient Lights */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            </div>

            {/* The Machine Area */}
            <div className="glass-panel rounded-3xl border-white/5 min-h-[600px] flex flex-col items-center justify-center relative bg-gradient-to-b from-[#0B0F19] to-black overflow-hidden shadow-2xl">
              
              {/* Environment Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30"></div>
              <div className="absolute top-0 w-full h-40 bg-gradient-to-b from-indigo-900/10 to-transparent"></div>

              {/* Machine Structure */}
              <div className="relative z-10 flex flex-col items-center mt-8">
                 
                 {/* Extraction Tube (Top) */}
                 <div className="w-16 h-48 border-x-2 border-white/10 bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-sm relative overflow-hidden z-20 rounded-t-lg">
                     <div className="absolute inset-0 bg-blue-500/5"></div>
                     {/* Reflection highlights */}
                     <div className="absolute left-1 top-0 bottom-0 w-1 bg-white/30 blur-[1px]"></div>
                     <div className="absolute right-2 top-0 bottom-0 w-2 bg-white/10 blur-[2px]"></div>

                     {/* The Travelling Ball */}
                     {currentTubeBall && (
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full shadow-2xl animate-float-up flex items-center justify-center z-30">
                              <div className={`w-full h-full rounded-full ${currentTubeBall.color} shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.4),inset_2px_2px_6px_rgba(255,255,255,0.4)] flex items-center justify-center text-white font-black text-xs border border-white/20`}>
                                  {currentTubeBall.num}
                              </div>
                         </div>
                     )}
                 </div>

                 {/* Connection Collar */}
                 <div className="w-24 h-6 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-lg border border-gray-600 shadow-xl z-20 relative -mt-1 flex items-center justify-center">
                    <div className="w-20 h-1 bg-black/50 rounded-full"></div>
                 </div>

                 {/* Main Barrel (Sphere) */}
                 <div className="relative -mt-3">
                     {/* Glass Sphere Container */}
                     <div className="w-72 h-72 rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-[2px] shadow-[0_0_80px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(255,255,255,0.1)] relative overflow-hidden flex items-center justify-center z-10">
                         
                         {/* Glass Highlights */}
                         <div className="absolute top-12 left-10 w-20 h-10 bg-white/10 rounded-full blur-xl -rotate-45 pointer-events-none"></div>
                         <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

                         {/* Air Jet Base */}
                         <div className="absolute bottom-0 w-32 h-8 bg-black/40 blur-md"></div>
                         {barrelState === 'mixing' && (
                           <div className="absolute bottom-0 w-20 h-20 bg-white/20 blur-3xl animate-pulse"></div>
                         )}

                         {/* THE BOUNCING BALLS */}
                         <div className="absolute inset-0 overflow-hidden rounded-full">
                            {visualBalls.map((ball) => (
                              <div
                                key={ball.id}
                                className={`
                                  absolute w-7 h-7 rounded-full 
                                  ${ball.color}
                                  shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)]
                                  border border-white/20
                                  flex items-center justify-center
                                  transition-all duration-700 ease-out
                                `}
                                style={{
                                  // IDLE STATE: Piled at bottom
                                  bottom: barrelState === 'idle' ? ball.idleBottom : '50%', 
                                  left: barrelState === 'idle' ? ball.idleLeft : '50%',
                                  transform: barrelState === 'idle' 
                                     ? `rotate(${ball.idleRotate})` 
                                     : `translate(-50%, -50%)`, // Centered base for animation
                                  
                                  // MIXING STATE: Chaotic Animation
                                  animation: barrelState === 'mixing' 
                                     ? `tumble-${ball.animType} ${ball.animDuration} infinite linear alternate` 
                                     : 'none',
                                  animationDelay: ball.animDelay
                                }}
                              >
                                <div className="w-3 h-3 bg-white/20 rounded-full blur-[1px]"></div>
                              </div>
                            ))}
                         </div>

                     </div>

                     {/* Base Stand */}
                     <div className="absolute top-[92%] left-1/2 -translate-x-1/2 w-40 h-20 bg-gradient-to-b from-gray-800 to-black clip-path-trapezoid z-0">
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] flex items-center gap-1">
                          <Wind className="w-3 h-3" /> Air-Jet
                        </div>
                     </div>
                 </div>
              </div>

              {/* Results Tray Display */}
              <div className="w-full max-w-5xl px-4 mt-12 mb-8 relative z-20">
                  <div className="bg-black/60 border border-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-8 justify-center min-h-[90px]">
                          {/* Main Balls */}
                          <div className="flex flex-wrap justify-center gap-3">
                              {mainNumbers.map((num, idx) => (
                                  <div key={`m-${idx}`} className="animate-in zoom-in slide-in-from-top-4 duration-500">
                                      <NumberBall number={num} />
                                      <div className="text-[9px] text-center text-gray-500 font-bold uppercase mt-2">#{idx+1}</div>
                                  </div>
                              ))}
                              {Array.from({ length: Math.max(0, config.mainCount - mainNumbers.length) }).map((_, i) => (
                                  <div key={`ph-${i}`} className="flex flex-col items-center opacity-30">
                                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 bg-white/5 flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                      </div>
                                      <div className="text-[9px] text-center text-gray-500 font-bold uppercase mt-2">--</div>
                                  </div>
                              ))}
                          </div>

                          {/* Divider */}
                          <div className="h-12 w-px bg-white/10 hidden md:block"></div>

                          {/* Bonus Balls */}
                          <div className="flex flex-wrap justify-center gap-3">
                               {bonusNumbers.map((num, idx) => (
                                  <div key={`b-${idx}`} className="animate-in zoom-in slide-in-from-top-4 duration-500">
                                      <NumberBall number={num} isBonus />
                                      <div className="text-[9px] text-center text-yellow-500/50 font-bold uppercase mt-2">Sup</div>
                                  </div>
                              ))}
                          </div>

                          {/* Powerball */}
                          {isPowerballGame && (
                              <>
                                  <div className="h-12 w-px bg-white/10 hidden md:block"></div>
                                  <div className="flex flex-col items-center">
                                      {powerball ? (
                                          <div className="animate-in zoom-in slide-in-from-top-4 duration-500 relative">
                                              <Zap className="w-5 h-5 text-yellow-400 absolute -top-3 -right-2 animate-bounce drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                                              <NumberBall number={powerball} isPowerball />
                                              <div className="text-[9px] text-center text-white font-black uppercase mt-2">PB</div>
                                          </div>
                                      ) : (
                                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-600 bg-gray-800 flex items-center justify-center shadow-inner opacity-50">
                                              <Zap className="w-4 h-4 text-gray-500" />
                                          </div>
                                      )}
                                  </div>
                              </>
                          )}
                      </div>
                  </div>
              </div>

            </div>
            
            {/* Mobile Sponsored Area */}
            <div className="lg:hidden">
              <div className="glass-panel rounded-2xl p-4 border-white/5 bg-gray-900/20">
                 <div className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-2 text-center w-full">
                    Sponsored
                 </div>
                 <AdUnit slot="SIDEBAR" format="horizontal" className="w-full" />
              </div>
            </div>

            {/* Control Panel */}
            <div className="flex justify-center -mt-10 relative z-30">
               <button
                  onClick={startDraw}
                  disabled={isDrawing}
                  className={`
                     group relative px-10 py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all
                     ${isDrawing 
                       ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                       : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-400/50 hover:scale-105 active:scale-95'}
                  `}
               >
                  <div className="flex items-center gap-3">
                     {isDrawing ? <Wind className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 fill-current" />}
                     {isDrawing ? 'System Running' : 'Start Draw'}
                  </div>
                  {!isDrawing && (
                      <div className="absolute inset-0 rounded-2xl bg-indigo-400 opacity-20 blur-md group-hover:opacity-40 transition-opacity"></div>
                  )}
               </button>
            </div>
        </div>

      </div>

      {/* Physics Animations - Wide & Chaotic */}
      <style>{`
        .clip-path-trapezoid {
          clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
        }
        @keyframes float-up {
          0% { transform: translate(-50%, 150%); opacity: 0; scale: 0.8; }
          20% { opacity: 1; scale: 1; }
          100% { transform: translate(-50%, -150%); }
        }
        .animate-float-up {
          animation: float-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        /* Chaotic Bounce Patterns - Large Scale Translations */
        /* Center is 0,0. Container radius is approx 4-5x ball width. */
        
        @keyframes tumble-1 {
            0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
            25% { transform: translate(-350%, -400%) rotate(90deg) scale(0.8); }
            50% { transform: translate(350%, -200%) rotate(180deg) scale(1.2); }
            75% { transform: translate(-100%, 350%) rotate(270deg) scale(0.9); }
            100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
        }
        @keyframes tumble-2 {
            0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.9); }
            30% { transform: translate(400%, -400%) rotate(-120deg) scale(1.1); }
            60% { transform: translate(-400%, 100%) rotate(-240deg) scale(0.8); }
            100% { transform: translate(-50%, -50%) rotate(-360deg) scale(0.9); }
        }
        @keyframes tumble-3 {
            0% { transform: translate(-50%, -50%); }
            25% { transform: translate(-50%, -450%) scale(0.8); } /* High vertical shoot */
            50% { transform: translate(-400%, 0%) scale(1.1); }
            75% { transform: translate(350%, 350%) scale(0.9); }
            100% { transform: translate(-50%, -50%); }
        }
        @keyframes tumble-4 {
             0% { transform: translate(-50%, -50%) scale(1); }
             33% { transform: translate(300%, -300%) scale(1.3); } /* Zoom in close */
             66% { transform: translate(-300%, -200%) scale(0.6); } /* Zoom away */
             100% { transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes tumble-5 {
             0% { transform: translate(-50%, -50%) rotate(0deg); }
             20% { transform: translate(300%, -100%) rotate(100deg); }
             40% { transform: translate(-200%, 300%) rotate(200deg); }
             60% { transform: translate(-300%, -300%) rotate(300deg); }
             80% { transform: translate(200%, 200%) rotate(400deg); }
             100% { transform: translate(-50%, -50%) rotate(500deg); }
        }
        @keyframes tumble-6 {
             0% { transform: translate(-50%, -50%) scale(1); }
             50% { transform: translate(0%, -450%) scale(0.7); } /* Shoot straight up tube path */
             100% { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SimulatorView;