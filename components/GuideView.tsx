
import React from 'react';
import { BookOpen, Layers, RotateCcw, Map as MapIcon, Hash, Target, Brain, Sparkles, Zap } from 'lucide-react';
import { LOTTERY_THEORIES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const THEORY_ICONS: Record<string, any> = {
  'Barrel Sequence Theory': Layers,
  'Repeat Numbers Theory': RotateCcw,
  'Landing Areas Theory': MapIcon,
  'Similar Sequence Theory': Hash,
  'Angel Numbers Theory': Sparkles,
};

const GuideView: React.FC = () => {
  const { t } = useLanguage();

  const getTranslatedTheoryName = (originalName: string) => {
    if (originalName.includes('Barrel')) return t('theory.barrel');
    if (originalName.includes('Repeat')) return t('theory.repeat');
    if (originalName.includes('Landing')) return t('theory.landing');
    if (originalName.includes('Similar')) return t('theory.similar');
    if (originalName.includes('Angel')) return t('theory.angel');
    return originalName;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel rounded-3xl p-8 border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t('guide.title')}</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Methodologies & Models</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 rounded-3xl border border-indigo-500/10">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" /> AI Analysis Engine
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t('guide.intro')}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tight pl-2 border-l-4 border-indigo-500">
                Core Theories
              </h3>
              {LOTTERY_THEORIES.map((theory, idx) => {
                const Icon = THEORY_ICONS[theory.name] || Hash;
                return (
                  <div key={idx} className="p-5 bg-gray-900/40 rounded-2xl border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gray-800 rounded-lg text-gray-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-indigo-200 text-sm">{getTranslatedTheoryName(theory.name)}</div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed ml-11">
                      {theory.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
             {/* Angel Numbers Highlight Box */}
             <div className="p-6 bg-indigo-900/20 rounded-3xl border border-indigo-500/20 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <h3 className="text-lg font-black text-white flex items-center gap-2 relative z-10">
                   <Sparkles className="w-5 h-5 text-indigo-400" /> Angel Numbers & Synchronicity
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed relative z-10">
                   In modern numerology, recurring sequences (like 11:11) are often interpreted as "Angel Numbers"—signals of alignment. 
                   Our AI adapts this concept for lottery draws by mathematically prioritizing:
                </p>
                <ul className="space-y-3 relative z-10 mt-2">
                    <li className="flex items-start gap-3 text-xs text-gray-400">
                        <div className="p-1.5 bg-indigo-500/20 rounded-full text-indigo-400 mt-0.5">
                            <Zap className="w-3 h-3" />
                        </div>
                        <div>
                            <strong className="text-indigo-200 block mb-0.5">Repdigits</strong>
                            High weighting on numbers like 11, 22, 33, 44.
                        </div>
                    </li>
                    <li className="flex items-start gap-3 text-xs text-gray-400">
                        <div className="p-1.5 bg-indigo-500/20 rounded-full text-indigo-400 mt-0.5">
                            <Brain className="w-3 h-3" />
                        </div>
                        <div>
                            <strong className="text-indigo-200 block mb-0.5">Signal Interpretation</strong>
                            Use the "Angel Hints" input to tell the AI what you've seen (e.g., "Three Doves"). The AI maps these qualitative signals to quantitative number sets.
                        </div>
                    </li>
                </ul>
             </div>

             <div className="p-6 bg-gray-900/40 rounded-3xl border border-gray-800 space-y-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                   <Target className="w-5 h-5 text-green-400" /> {t('res.coverage')}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                   The "Probabilistic Coverage" option attempts to mathematically spread your entries to cover a wider range of the 
                   number field. Instead of picking completely random sets, the AI ensures your sets don't overlap too heavily, 
                   giving you a better statistical chance of hitting a winning combination if the draw falls within standard distribution curves.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                   <div className="p-3 bg-black/30 rounded-xl text-center">
                      <div className="text-[10px] font-bold text-gray-500 uppercase">Standard Entry</div>
                      <div className="text-xs text-gray-300 mt-1">Single set of numbers.</div>
                   </div>
                   <div className="p-3 bg-black/30 rounded-xl text-center border border-green-500/20">
                      <div className="text-[10px] font-bold text-green-500 uppercase">System Entry</div>
                      <div className="text-xs text-gray-300 mt-1">Combinatorial spread.</div>
                   </div>
                </div>
             </div>

             <div className="p-6 bg-gray-900/40 rounded-3xl border border-gray-800">
                <h3 className="text-lg font-black text-white mb-4">How to use</h3>
                <ul className="space-y-4 text-sm text-gray-400">
                   <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white shrink-0">1</span>
                      <span>Select your preferred game (e.g., USA Power Lotto).</span>
                   </li>
                   <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white shrink-0">2</span>
                      <span>Sync historical data. The AI needs recent results to analyze trends.</span>
                   </li>
                   <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white shrink-0">3</span>
                      <span>Configure your entry (volume, system type) and input your "Lucky" or "Unwanted" numbers.</span>
                   </li>
                   <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">4</span>
                      <span>Click "Execute" and review the AI's generated entries and strategic breakdown.</span>
                   </li>
                   <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold text-white shrink-0">5</span>
                      <span>Use the "Play Now" button to visit the official retailer and play your generated strategy.</span>
                   </li>
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideView;
