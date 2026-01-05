
import React, { useState } from 'react';
import { ArrowLeft, Moon, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MoonBlocksViewProps {
  onBack: () => void;
  onConfirmLucky: (num: number) => void;
  limit: number;
}

type ResultType = 'sheng' | 'xiao' | 'wu' | null;

// Crescent Moon Shape Path (Symmetric)
const MOON_PATH = "M5,55 Q50,-15 95,55 Q50,25 5,55";

const MoonBlock = ({ rotation, delay }: { rotation: number, delay: number }) => (
  <div 
    className="relative w-32 h-32 preserve-3d transition-transform duration-[2000ms] cubic-bezier(0.2, 0.8, 0.2, 1)" 
    style={{ transform: `rotateX(${rotation}deg) rotateZ(${delay % 2 === 0 ? -15 : 15}deg)` }}
  >
    {/* Front: Flat Side (Yang) */}
    <div className="absolute inset-0 backface-hidden drop-shadow-2xl">
      <svg viewBox="0 0 100 80" className="w-full h-full">
        <path d={MOON_PATH} fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
        {/* Wood grain / Flat texture hints */}
        <path d="M20,40 Q50,20 80,40" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
        <text x="50" y="45" textAnchor="middle" fill="rgba(0,0,0,0.2)" fontSize="18" fontWeight="900" style={{ pointerEvents: 'none' }}>陽</text>
        <text x="50" y="55" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="6" fontWeight="700" style={{ pointerEvents: 'none' }}>FLAT</text>
      </svg>
    </div>

    {/* Back: Curved Side (Yin) */}
    <div className="absolute inset-0 backface-hidden drop-shadow-2xl" style={{ transform: 'rotateX(180deg)' }}>
      <svg viewBox="0 0 100 80" className="w-full h-full">
        <defs>
          <radialGradient id="moonCurveGrad" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </radialGradient>
        </defs>
        <path d={MOON_PATH} fill="url(#moonCurveGrad)" stroke="#7F1D1D" strokeWidth="1" />
        {/* Highlight for curvature */}
        <path d="M20,40 Q50,10 80,40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <text x="50" y="45" textAnchor="middle" fill="rgba(0,0,0,0.3)" fontSize="18" fontWeight="900" style={{ pointerEvents: 'none' }}>陰</text>
        <text x="50" y="55" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="6" fontWeight="700" style={{ pointerEvents: 'none' }}>ROUND</text>
      </svg>
    </div>
  </div>
);

const MoonBlocksView: React.FC<MoonBlocksViewProps> = ({ onBack, onConfirmLucky, limit }) => {
  const { t } = useLanguage();
  const [number, setNumber] = useState<string>('');
  const [isTossing, setIsTossing] = useState(false);
  const [streak, setStreak] = useState(0);
  
  // Rotation states for 3D simulation
  const [leftRot, setLeftRot] = useState(0);
  const [rightRot, setRightRot] = useState(0);
  
  const [result, setResult] = useState<ResultType>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToss = () => {
    setError(null);
    if (!number || isNaN(parseInt(number))) return;
    const val = parseInt(number);
    if (val < 1 || val > limit) {
      setError(`Choose a number between 1 and ${limit}`);
      return;
    }

    setIsTossing(true);
    setResult(null);

    // Simulation Logic
    // 0 = Curved/Round (Yin), 1 = Flat (Yang)
    const leftVal = Math.random() > 0.5 ? 1 : 0;
    const rightVal = Math.random() > 0.5 ? 1 : 0;
    const sum = leftVal + rightVal;

    let outcome: ResultType = 'wu';
    // 1 + 0 or 0 + 1 = Sheng (Holy) - One flat, one round
    if (sum === 1) outcome = 'sheng';
    // 1 + 1 = Xiao (Laugh) - Two flat
    else if (sum === 2) outcome = 'xiao';
    // 0 + 0 = Wu (No) - Two round
    else outcome = 'wu';

    // Calculate Rotations
    // Visual Logic:
    // Flat Side (Yang) is FRONT (0deg mod 360).
    // Curved Side (Yin) is BACK (180deg mod 360).
    
    const minSpin = 1440; // 4 full spins
    
    // Left Block
    let nextLeft = leftRot + minSpin + (Math.random() * 360);
    const leftMod = nextLeft % 360;
    const targetLeft = leftVal === 1 ? 0 : 180;
    // Adjust to land on target
    nextLeft += (targetLeft - leftMod + 360) % 360;

    // Right Block
    let nextRight = rightRot + minSpin + (Math.random() * 360);
    const rightMod = nextRight % 360;
    const targetRight = rightVal === 1 ? 0 : 180;
    nextRight += (targetRight - rightMod + 360) % 360;

    setLeftRot(nextLeft);
    setRightRot(nextRight);

    setTimeout(() => {
      setResult(outcome);
      setIsTossing(false);
      
      if (outcome === 'sheng') {
        setStreak(prev => prev + 1);
      } else {
        setStreak(0); // Reset streak on anything other than Sheng Bei
      }
    }, 2000);
  };

  const handleReset = () => {
    setStreak(0);
    setResult(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="glass-panel rounded-3xl p-8 border-white/5 min-h-[80vh] flex flex-col items-center relative overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8 z-10">
          <button 
            onClick={onBack}
            className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2 justify-center">
              <Moon className="w-6 h-6 text-red-500" /> {t('moon.title')}
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              Jiaobei (Max: {limit})
            </p>
          </div>
          <div className="w-11" />
        </div>

        {/* Streak Counter */}
        <div className="mb-12 z-10">
           <div className="flex gap-2">
             {[1, 2, 3].map(i => (
               <div 
                 key={i} 
                 className={`w-12 h-2 rounded-full transition-all duration-500 ${streak >= i ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gray-800'}`} 
               />
             ))}
           </div>
           <p className="text-center text-[10px] font-bold text-gray-500 uppercase mt-2 tracking-widest">{t('moon.streak')}</p>
        </div>

        {/* 3D Scene */}
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-lg perspective-container relative z-10 mb-12">
            <div className="flex gap-8 md:gap-16">
                <MoonBlock rotation={leftRot} delay={0} />
                <MoonBlock rotation={rightRot} delay={1} />
            </div>
            
            {/* Shadow beneath blocks */}
            <div className="absolute -bottom-10 w-64 h-8 bg-black/50 blur-xl rounded-[100%]"></div>
        </div>

        {/* Controls & Results */}
        <div className="w-full space-y-6 text-center z-10 max-w-md">
            {streak === 3 ? (
                <div className="space-y-6 animate-in zoom-in duration-500">
                    <div className="text-center">
                        <div className="text-4xl font-black text-red-500 uppercase tracking-tighter drop-shadow-[0_0_25px_rgba(239,68,68,0.6)] mb-2">
                            Success!
                        </div>
                        <p className="text-gray-400 text-sm">The spirits have validated number <span className="text-white font-bold text-lg">{number}</span>.</p>
                    </div>
                    <button 
                     onClick={() => onConfirmLucky(parseInt(number))}
                     className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-lg uppercase tracking-wide shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 transition-transform hover:scale-105"
                   >
                     <Check className="w-6 h-6" /> Use Number {number}
                   </button>
                </div>
            ) : (
                <>
                    {/* Input Area */}
                    {!isTossing && (
                         <div className="flex gap-2 justify-center mb-4">
                            <input 
                            type="number"
                            value={number}
                            onChange={(e) => {
                                setNumber(e.target.value);
                                setError(null);
                                if(streak > 0) handleReset(); // Reset streak if number changes
                            }}
                            placeholder="#"
                            className="w-24 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-center text-white font-bold text-xl outline-none focus:border-red-500 transition-colors"
                            autoFocus
                            />
                            <button 
                            onClick={handleToss}
                            disabled={!number}
                            className="flex-1 px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all active:scale-95"
                            >
                            {streak > 0 ? 'Toss Again' : 'Toss Blocks'}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 py-2 rounded-lg animate-pulse mb-4">
                        <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    {/* Result Text */}
                    <div className="h-20 flex items-center justify-center">
                        {isTossing ? (
                            <span className="text-red-400 font-bold uppercase tracking-widest animate-pulse">Consulting Spirits...</span>
                        ) : result ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <div className={`text-2xl font-black uppercase tracking-tight ${result === 'sheng' ? 'text-green-400' : result === 'xiao' ? 'text-yellow-400' : 'text-gray-500'}`}>
                                    {t(`moon.${result}`)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 font-medium">
                                    {result === 'sheng' && streak < 3 && "Keep going! Need consecutive wins."}
                                    {result === 'xiao' && "The gods are laughing. Streak broken."}
                                    {result === 'wu' && "The gods disagree. Streak broken."}
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-600 text-xs uppercase tracking-widest">{t('moon.desc')}</span>
                        )}
                    </div>
                </>
            )}
        </div>

        <style>{`
          .perspective-container {
            perspective: 1000px;
          }
          .preserve-3d {
            transform-style: preserve-3d;
          }
          .backface-hidden {
            backface-visibility: hidden;
          }
        `}</style>
      </div>
    </div>
  );
};

export default MoonBlocksView;
