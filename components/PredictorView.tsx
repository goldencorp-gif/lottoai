
import React, { useState, useMemo } from 'react';
import { LotteryGameType, PredictionResult, GameConfig } from '../types';
import { GAME_CONFIGS, LOTTERY_THEORIES, BUY_LINKS } from '../constants';
import { analyzeAndPredict, getAiSuggestions } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import NumberBall from './NumberBall';
import Visualizer from './Visualizer';
import AdUnit from './AdUnit';
import { 
  Brain, RefreshCw, Send, Star, Target, CheckCircle2,
  TrendingUp, Percent, Ban, Globe, Settings2, Sliders, Database, ArrowRight,
  Eye, Dices, Info, X, Sparkles, Zap, ExternalLink, Moon, Feather, MapPin
} from 'lucide-react';

interface PredictorViewProps {
  selectedGame: LotteryGameType;
  setSelectedGame: (game: LotteryGameType) => void;
  customParams: Partial<GameConfig>;
  setCustomParams: React.Dispatch<React.SetStateAction<Partial<GameConfig>>>;
  historyText: string;
  onOpenDataWizard: () => void;
  luckyNumbersInput: string;
  setLuckyNumbersInput: (val: string) => void;
  angelInput: string;
  setAngelInput: (val: string) => void;
  onTestLuck: () => void;
  onTestMoon: () => void;
}

const PredictorView: React.FC<PredictorViewProps> = ({ 
  selectedGame, 
  setSelectedGame, 
  customParams,
  setCustomParams,
  historyText, 
  onOpenDataWizard, 
  luckyNumbersInput,
  setLuckyNumbersInput,
  angelInput,
  setAngelInput,
  onTestLuck,
  onTestMoon
}) => {
  const { t, language } = useLanguage();
  // customParams state moved to parent
  const [entryCount, setEntryCount] = useState<number>(4);
  const [selectedSystem, setSelectedSystem] = useState<number | 'standard'>('standard');
  const [unwantedNumbersInput, setUnwantedNumbersInput] = useState<string>('');
  const [includeCoverage, setIncludeCoverage] = useState<boolean>(true);
  const [enabledTheories, setEnabledTheories] = useState<string[]>(LOTTERY_THEORIES.map(t => t.name));
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoTheory, setInfoTheory] = useState<{name: string, description: string} | null>(null);
  
  // Independent Suggestion State
  const [aiSuggestions, setAiSuggestions] = useState<number[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const config = useMemo(() => {
    const base = GAME_CONFIGS[selectedGame];
    return selectedGame === LotteryGameType.CUSTOM ? { ...base, ...customParams } : base;
  }, [selectedGame, customParams]);

  const availableSystems = useMemo(() => {
    const min = config.mainCount + 1;
    const systems = [];
    for (let i = min; i <= 20; i++) {
      systems.push(i);
    }
    return systems;
  }, [config.mainCount]);

  const gameGroups = useMemo(() => {
    const groups: Record<string, LotteryGameType[]> = {};
    Object.values(LotteryGameType).forEach(game => {
      const region = GAME_CONFIGS[game].region || 'Other';
      if (!groups[region]) groups[region] = [];
      groups[region].push(game);
    });
    return groups;
  }, []);

  const toggleTheory = (name: string) => {
    setEnabledTheories(prev => 
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  const parseNumbersInput = (input: string) => {
    return input.split(/[\s,]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  };

  const handlePredict = async () => {
    // Blocking check removed. AI will handle empty history as "Cold Analysis".
    setIsAnalyzing(true);
    setError(null);
    try {
      const sysNum = selectedSystem === 'standard' ? null : selectedSystem;
      const prediction = await analyzeAndPredict(
        selectedGame, 
        historyText, 
        entryCount, 
        parseNumbersInput(luckyNumbersInput), 
        parseNumbersInput(unwantedNumbersInput),
        angelInput,
        includeCoverage, 
        enabledTheories,
        sysNum,
        selectedGame === LotteryGameType.CUSTOM ? customParams : undefined,
        language
      );
      setResults(prediction);
    } catch (err) {
      setError("Simulation failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetSuggestions = async () => {
    // Blocking check removed.
    setIsSuggesting(true);
    setError(null);
    try {
      const suggestions = await getAiSuggestions(
        selectedGame,
        historyText,
        enabledTheories,
        parseNumbersInput(unwantedNumbersInput),
        angelInput,
        selectedGame === LotteryGameType.CUSTOM ? customParams : undefined,
        language
      );
      setAiSuggestions(suggestions);
    } catch (e) {
      setError("Could not scan market suggestions.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const addSuggestionToLucky = (num: number) => {
      const current = parseNumbersInput(luckyNumbersInput);
      if (!current.includes(num)) {
          const newVal = current.length > 0 ? `${luckyNumbersInput}, ${num}` : `${num}`;
          setLuckyNumbersInput(newVal);
      }
  };

  const handleImageGenerated = (url: string) => {
    if (results) {
      setResults({ ...results, visualUrl: url });
    }
  };

  const getTranslatedTheoryName = (originalName: string) => {
      if (originalName.includes('Barrel')) return t('theory.barrel');
      if (originalName.includes('Repeat')) return t('theory.repeat');
      if (originalName.includes('Landing')) return t('theory.landing');
      if (originalName.includes('Similar')) return t('theory.similar');
      if (originalName.includes('Angel')) return t('theory.angel');
      return originalName;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <section className="glass-panel rounded-3xl p-6 shadow-2xl border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black flex items-center gap-2 text-indigo-400">
                <Globe className="w-5 h-5" /> {t('step1.title')}
              </h2>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {Object.entries(gameGroups).map(([region, games]: [string, LotteryGameType[]]) => (
                 <div key={region} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{region}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {games.map((game) => (
                        <button
                          key={game}
                          onClick={() => { setSelectedGame(game); setResults(null); setAiSuggestions([]); }}
                          className={`
                            text-left px-4 py-3 rounded-2xl border transition-all relative overflow-hidden group
                            ${selectedGame === game 
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                              : 'bg-gray-800/40 border-gray-700 text-gray-500 hover:border-gray-500'}
                          `}
                        >
                          <div className="font-bold text-sm tracking-tight">{game}</div>
                          <div className="text-[9px] opacity-50 uppercase mt-0.5">{GAME_CONFIGS[game].description}</div>
                          {selectedGame === game && <CheckCircle2 className="w-4 h-4 text-indigo-400 absolute right-4 top-1/2 -translate-y-1/2" />}
                        </button>
                      ))}
                    </div>
                 </div>
              ))}
            </div>

            {selectedGame === LotteryGameType.CUSTOM && (
              <div className="mt-4 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  <Sliders className="w-3 h-3" /> Custom Rule Engine
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold">Main Count</label>
                    <input 
                      type="number" value={customParams.mainCount} 
                      onChange={e => setCustomParams(p => ({...p, mainCount: Number(e.target.value)}))}
                      className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold">Max Range</label>
                    <input 
                      type="number" value={customParams.mainRange} 
                      onChange={e => setCustomParams(p => ({...p, mainRange: Number(e.target.value)}))}
                      className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Data Feed (Moved Up) */}
          <section className="glass-panel rounded-3xl p-6 shadow-2xl border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black flex items-center gap-2 text-indigo-400">
                <Database className="w-5 h-5" /> {t('step2.title')}
              </h2>
            </div>
            
            <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase">Status</span>
                <span className={`text-xs font-black uppercase ${historyText.length > 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {historyText.length > 50 ? t('step2.status.active') : t('step2.status.missing')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase">{t('lbl.volume')}</span>
                <span className="text-xs font-mono text-gray-300">{historyText.length} chars</span>
              </div>
              
              <button 
                onClick={onOpenDataWizard}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 hover:text-white text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all border border-gray-700 hover:border-indigo-500/50 group"
              >
                {t('step2.btn')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>

          {/* Step 3: Entry Tuning (Moved Down) */}
          <section className="glass-panel rounded-3xl p-6 shadow-2xl border-white/5 space-y-6">
            <h2 className="text-lg font-black flex items-center gap-2 text-indigo-400">
              <Settings2 className="w-5 h-5" /> {t('step3.title')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">{t('lbl.volume')}</label>
                <input
                  type="number" min="1" max="50"
                  value={entryCount}
                  onChange={(e) => setEntryCount(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">{t('lbl.system')}</label>
                <select
                  value={selectedSystem}
                  onChange={(e) => setSelectedSystem(e.target.value === 'standard' ? 'standard' : Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 transition-colors"
                >
                  <option value="standard">Standard</option>
                  {availableSystems.map(s => <option key={s} value={s}>System {s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-800">
              {/* Lucky Numbers Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-yellow-500/70 uppercase tracking-widest px-1">
                    <Star className="w-2.5 h-2.5" /> {t('lbl.lucky')}
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={onTestLuck}
                      className="text-[9px] font-bold text-yellow-500 hover:text-white flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-md hover:bg-yellow-500/20 transition-all"
                      title="Coin Flip"
                    >
                      <Dices className="w-3 h-3" /> Coin
                    </button>
                    <button 
                      onClick={onTestMoon}
                      className="text-[9px] font-bold text-red-400 hover:text-white flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-md hover:bg-red-500/20 transition-all"
                      title="Moon Blocks (Jiaobei)"
                    >
                      <Moon className="w-3 h-3" /> Moon
                    </button>
                  </div>
                </div>
                <input
                  type="text" placeholder="Force (e.g., 7, 11)"
                  value={luckyNumbersInput}
                  onChange={(e) => setLuckyNumbersInput(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              {/* Angel Signals Input */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[9px] font-bold text-purple-400/80 uppercase tracking-widest px-1">
                  <Feather className="w-2.5 h-2.5" /> {t('lbl.angelHint')}
                </label>
                <div className="relative">
                  <input
                    type="text" placeholder={t('ph.angelHint')}
                    value={angelInput}
                    onChange={(e) => setAngelInput(e.target.value)}
                    className="w-full bg-purple-900/10 border border-purple-500/20 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                  <Sparkles className="absolute right-3 top-3 w-3 h-3 text-purple-400 opacity-50" />
                </div>
              </div>

              {/* Ban Numbers Input */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[9px] font-bold text-red-500/70 uppercase tracking-widest px-1">
                  <Ban className="w-2.5 h-2.5" /> {t('lbl.ban')}
                </label>
                <input
                  type="text" placeholder="Ban (e.g., 13, 44)"
                  value={unwantedNumbersInput}
                  onChange={(e) => setUnwantedNumbersInput(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>

              {/* AI Suggest Section */}
              <div className="space-y-1.5 pt-2">
                 <div className="flex items-center justify-between px-1">
                     <label className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400/90 uppercase tracking-widest">
                        <Sparkles className="w-2.5 h-2.5" /> {t('lbl.suggest')}
                     </label>
                     {(aiSuggestions.length > 0 || results?.suggestedNumbers) && (
                         <button 
                            onClick={handleGetSuggestions} 
                            disabled={isSuggesting}
                            className="text-[9px] text-indigo-400 hover:text-white transition-colors"
                         >
                            <RefreshCw className={`w-3 h-3 ${isSuggesting ? 'animate-spin' : ''}`} />
                         </button>
                     )}
                 </div>
                 
                 <div className="w-full bg-gray-900/30 border border-indigo-500/20 rounded-xl px-4 py-3 min-h-[50px] flex flex-wrap gap-2 items-center justify-center relative overflow-hidden">
                    {isSuggesting ? (
                         <div className="flex items-center gap-2 text-[10px] text-indigo-300 animate-pulse">
                            <Brain className="w-3 h-3" /> {t('btn.scanning')}
                         </div>
                    ) : (aiSuggestions.length > 0 || results?.suggestedNumbers) ? (
                         (aiSuggestions.length > 0 ? aiSuggestions : results?.suggestedNumbers || []).map(n => (
                             <button 
                                key={n} 
                                onClick={() => addSuggestionToLucky(n)}
                                title="Click to add to Lucky Numbers"
                                className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20 shadow-sm hover:bg-indigo-500/20 hover:text-white cursor-pointer transition-all"
                             >
                                {n}
                             </button>
                         ))
                    ) : (
                        <button
                            onClick={handleGetSuggestions}
                            // Disabled removed so user can request pure AI suggestions
                            className="w-full h-full flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-400/60 hover:text-indigo-400 uppercase tracking-wide transition-colors"
                        >
                            {t('btn.scan')}
                        </button>
                    )}
                 </div>
              </div>
            </div>
            
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-gray-500 uppercase">Theory Matrix</label>
               <div className="grid grid-cols-2 gap-3">
                 {LOTTERY_THEORIES.map(t => (
                   <div key={t.name} className="relative">
                     <button 
                       onClick={() => toggleTheory(t.name)}
                       className={`w-full p-2.5 rounded-xl border text-[9px] font-black uppercase tracking-tighter transition-all ${enabledTheories.includes(t.name) ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-gray-800/40 border-gray-700 text-gray-600'}`}
                     >
                       {getTranslatedTheoryName(t.name)}
                     </button>
                     <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoTheory(t);
                        }}
                        className="absolute -top-2 -right-1 bg-gray-900 text-gray-500 hover:text-indigo-400 border border-gray-700 rounded-full p-1 transition-colors shadow-sm z-10"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                   </div>
                 ))}
               </div>
            </div>

            <button
              onClick={() => setIncludeCoverage(!includeCoverage)}
              className={`
                w-full flex items-center justify-between p-3 rounded-2xl border transition-all
                ${includeCoverage ? 'bg-green-600/10 border-green-500/30 text-green-100' : 'bg-gray-800/40 border-gray-800 text-gray-500'}
              `}
            >
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                <Target className="w-4 h-4" /> {t('res.coverage')}
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${includeCoverage ? 'bg-green-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeCoverage ? 'left-6' : 'left-1'}`} />
              </div>
            </button>
          </section>

          {/* AD SLOT 1: Sidebar Bottom (Moved to dedicated container) */}
          <div className="glass-panel rounded-3xl p-4 border-white/5 flex flex-col items-center justify-center min-h-[250px]">
             <AdUnit slot="SIDEBAR" format="rectangle" className="w-full" />
          </div>

        </div>

        {/* Main: Analysis Results */}
        <div className="lg:col-span-8 space-y-6">
          <section className="glass-panel rounded-3xl p-8 shadow-2xl min-h-[700px] border-white/5 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{t('res.title')}</h2>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{selectedGame} | AU Model V.4.0</div>
              </div>
              {results && (
                <div className="flex flex-wrap items-center gap-2">
                  {BUY_LINKS[selectedGame] && (
                    <a 
                      href={BUY_LINKS[selectedGame]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow-lg shadow-green-600/20 flex items-center gap-2"
                    >
                       {t('btn.playNow')} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-[10px] font-bold text-indigo-400 uppercase">
                    Score: {results.strategicWeight}%
                  </div>
                </div>
              )}
            </div>

            {!results && !isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-40 text-center space-y-6 opacity-40">
                <div className="p-8 bg-gray-800/40 rounded-full">
                  <Target className="w-20 h-20 text-gray-600" />
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-xs">{t('res.waiting')}</p>
                {historyText.length < 50 && (
                   <p className="text-gray-500 text-[10px] font-bold uppercase bg-gray-800 px-3 py-1 rounded-full">
                     Data Feed Missing - Running in Cold Analysis Mode
                   </p>
                )}
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-48 space-y-8">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                  <Brain className="w-12 h-12 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">{t('res.analyzing')}</h3>
                  <p className="text-xs text-gray-500 font-mono italic animate-bounce">{t('res.sub')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Visualizer Component */}
                {results && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                       <Eye className="w-4 h-4" /> {t('res.visual')}
                    </div>
                    <Visualizer 
                      entries={results.entries} 
                      range={config.mainRange} 
                      gameName={selectedGame}
                      onImageGenerated={handleImageGenerated}
                      existingImageUrl={results.visualUrl}
                    />
                  </div>
                )}

                 {/* AD SLOT 2: Main Content Area (High Visibility) */}
                 <AdUnit slot="MAIN_RESULT" format="auto" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results?.entries.map((entry, idx) => (
                    <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Entry #{idx + 1}</span>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Main Numbers */}
                        <div className="flex flex-wrap gap-2">
                          {entry.sort((a,b) => a-b).map((num, nIdx) => (
                            <NumberBall key={nIdx} number={num} />
                          ))}
                        </div>
                        
                        {/* Powerball Separator */}
                        {results.powerballs && results.powerballs[idx] !== undefined && (
                          <>
                             <div className="h-8 w-px bg-white/20"></div>
                             <div className="relative" title="Powerball/MegaBall">
                                <Zap className="w-3 h-3 text-white absolute -top-1 -right-1 z-10 fill-white" />
                                <NumberBall number={results.powerballs[idx]} isPowerball={true} />
                             </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {results?.coverageStats && results.coverageStats.length > 0 && (
                  <div className="bg-green-600/5 border border-green-500/20 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-xl text-green-400">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t('res.coverage')}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {results.coverageStats.map((tier, tIdx) => (
                        <div key={tIdx} className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 flex flex-col items-center text-center space-y-2">
                          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-gray-700/50 pb-2 mb-1 w-full">{tier.division}</div>
                          
                          <div className="space-y-0.5">
                             <div className="text-[9px] font-bold text-gray-600 uppercase">Est. Odds</div>
                             <div className="text-lg font-black text-white font-mono tracking-tighter">{tier.probability}</div>
                          </div>
                          
                          <div className="space-y-0.5 pt-2">
                             <div className="text-[9px] font-bold text-gray-600 uppercase">Match Rule</div>
                             <div className="text-[10px] text-gray-400 leading-tight">{tier.requirement}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results?.analysis && (
                  <div className="p-8 bg-indigo-600/5 rounded-3xl border border-indigo-500/20 space-y-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Percent className="w-6 h-6 text-indigo-500" /> {t('res.tactical')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-400 leading-relaxed">
                      {results.analysis.split('\n\n').map((p, i) => (
                        <p key={i} className="bg-black/20 p-4 rounded-2xl border border-white/5">{p}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-50">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <button
            onClick={handlePredict}
            disabled={isAnalyzing}
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-black text-xl rounded-[2.5rem] shadow-[0_0_60px_rgba(79,70,229,0.3)] flex items-center justify-center gap-4 transition-all relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            {isAnalyzing ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
            {isAnalyzing ? t('btn.processing') : t('btn.execute')}
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {infoTheory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setInfoTheory(null)}>
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Decorative background blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">{getTranslatedTheoryName(infoTheory.name)}</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Theory Definition</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setInfoTheory(null)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="bg-black/40 p-5 rounded-2xl border border-white/5 relative z-10">
                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                        {infoTheory.description}
                    </p>
                </div>
                
                <div className="mt-4 flex justify-end relative z-10">
                    <button 
                        onClick={() => setInfoTheory(null)}
                        className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PredictorView;
