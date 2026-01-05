
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Check, X, Dices, AlertCircle } from 'lucide-react';

interface LuckTesterViewProps {
  onBack: () => void;
  onConfirmLucky: (num: number) => void;
  limit: number;
}

const LuckTesterView: React.FC<LuckTesterViewProps> = ({ onBack, onConfirmLucky, limit }) => {
  const [number, setNumber] = useState<string>('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFlip = () => {
    setError(null);
    if (!number || isNaN(parseInt(number))) return;
    
    const val = parseInt(number);
    
    if (val < 1 || val > limit) {
      setError(`Choose another number between 1 and ${limit}`);
      return;
    }

    setIsFlipping(true);
    setResult(null);
    
    // Determine result beforehand
    const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
    
    // Calculate rotation: 
    // We need to ensure the final rotation lands on:
    // 0 deg (mod 360) for Heads (Lucky)
    // 180 deg (mod 360) for Tails (Void)
    
    const minSpin = 1800; // 5 full spins minimum to ensure animation length
    let nextRotation = rotation + minSpin;
    
    const remainder = nextRotation % 360;
    
    if (outcome === 'heads') {
      // Must land on 0 mod 360
      if (remainder !== 0) {
        nextRotation += (360 - remainder);
      }
    } else {
      // Must land on 180 mod 360
      // Calculate difference needed to reach the next 180 mark
      const targetRemainder = 180;
      const difference = (targetRemainder - remainder + 360) % 360;
      nextRotation += difference;
    }
    
    setRotation(nextRotation);

    setTimeout(() => {
      setResult(outcome);
      setIsFlipping(false);
    }, 3000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="glass-panel rounded-3xl p-8 border-white/5 min-h-[80vh] flex flex-col items-center relative overflow-hidden">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-12 z-10">
          <button 
            onClick={onBack}
            className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2 justify-center">
              <Dices className="w-6 h-6 text-yellow-500" /> Luck Validation
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              Coin of Destiny (Max: {limit})
            </p>
          </div>
          <div className="w-11" /> {/* Spacer */}
        </div>

        {/* 3D Coin Scene */}
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-md perspective-container relative z-10">
          
          {/* Coin */}
          <div className="relative w-48 h-48 mb-12">
             <div 
               className="w-full h-full relative transition-transform duration-[3000ms] ease-out preserve-3d"
               style={{ transform: `rotateY(${rotation}deg)` }}
             >
               {/* Heads Side (Front) */}
               <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_50px_rgba(234,179,8,0.4)] flex items-center justify-center backface-hidden border-4 border-yellow-200">
                 <div className="w-[90%] h-[90%] rounded-full border-2 border-dashed border-yellow-800/50 flex flex-col items-center justify-center">
                   <Sparkles className="w-16 h-16 text-yellow-900 drop-shadow-sm" />
                   <span className="text-xl font-black text-yellow-900 uppercase tracking-widest mt-2">LUCKY</span>
                 </div>
               </div>
               
               {/* Tails Side (Back) */}
               <div 
                 className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-[0_0_50px_rgba(156,163,175,0.4)] flex items-center justify-center backface-hidden border-4 border-gray-200"
                 style={{ transform: 'rotateY(180deg)' }}
               >
                 <div className="w-[90%] h-[90%] rounded-full border-2 border-dashed border-gray-600/50 flex flex-col items-center justify-center">
                   <X className="w-16 h-16 text-gray-700 drop-shadow-sm" />
                   <span className="text-xl font-black text-gray-700 uppercase tracking-widest mt-2">VOID</span>
                 </div>
               </div>
             </div>
          </div>

          {/* Controls */}
          <div className="w-full space-y-6 text-center">
             {!result && !isFlipping && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <p className="text-sm text-gray-400 uppercase tracking-wider font-bold">Enter a number to test</p>
                  
                  {error && (
                    <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 py-2 rounded-lg animate-pulse">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    <input 
                      type="number"
                      value={number}
                      onChange={(e) => {
                        setNumber(e.target.value);
                        setError(null);
                      }}
                      placeholder={`1-${limit}`}
                      className="w-32 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-center text-white font-bold text-xl outline-none focus:border-yellow-500 transition-colors"
                      autoFocus
                    />
                    <button 
                      onClick={handleFlip}
                      disabled={!number}
                      className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-yellow-600/20 transition-all active:scale-95"
                    >
                      Test Luck
                    </button>
                  </div>
                </div>
             )}

             {isFlipping && (
               <div className="text-yellow-500 font-bold text-lg animate-pulse uppercase tracking-widest">
                 Consulting the Ether...
               </div>
             )}

             {result && !isFlipping && (
               <div className="space-y-6 animate-in zoom-in duration-300">
                 <div className="space-y-2">
                   <div className="text-3xl font-black uppercase tracking-tighter">
                     {result === 'heads' ? (
                       <span className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">Fate Favors {number}!</span>
                     ) : (
                       <span className="text-gray-500">Not This Time</span>
                     )}
                   </div>
                   <p className="text-xs text-gray-500 font-mono">
                     {result === 'heads' ? "Probability vectors aligned." : "Standard distribution variance detected."}
                   </p>
                 </div>

                 {result === 'heads' ? (
                   <button 
                     onClick={() => onConfirmLucky(parseInt(number))}
                     className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-lg uppercase tracking-wide shadow-xl shadow-green-600/20 flex items-center gap-2 mx-auto transition-transform hover:scale-105"
                   >
                     <Check className="w-6 h-6" /> Use Number {number}
                   </button>
                 ) : (
                   <button 
                     onClick={() => setResult(null)}
                     className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold text-sm uppercase tracking-wide transition-colors"
                   >
                     Try Another
                   </button>
                 )}
               </div>
             )}
          </div>

        </div>

        {/* CSS for 3D */}
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

export default LuckTesterView;
