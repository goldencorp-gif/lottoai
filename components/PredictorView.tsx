
import React, { useState, useMemo, useEffect } from 'react';
import { LotteryGameType, PredictionResult, GameConfig, SavedPrediction } from '../types';
import { GAME_CONFIGS, LOTTERY_THEORIES, BUY_LINKS } from '../constants';
import { analyzeAndPredict } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import NumberBall from './NumberBall';
import AdUnit from './AdUnit';
import { 
  Brain, RefreshCw, Send, Target, CheckCircle2,
  Percent, Globe, Sliders, Database, ArrowRight,
  Dices, ExternalLink, Moon, Bookmark, ShieldCheck, MapPin, AlertCircle, Settings, X, Save, Ticket, Zap
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
  onSaveToVault: (prediction: SavedPrediction) => void;
}

const PredictorView: React.FC<PredictorViewProps> = ({ 
  selectedGame, 
  setSelectedGame, 
  customParams,
  historyText, 
  onOpenDataWizard, 
  luckyNumbersInput,
  setLuckyNumbersInput,
  angelInput,
  setAngelInput,
  onTestLuck,
  onTestMoon,
  onSaveToVault
}) => {
  const { t, language } = useLanguage();
  const [entryCount, setEntryCount] = useState<number>(4);
  const [selectedSystem, setSelectedSystem] = useState<number | 'standard'>('standard');
  const [unwantedNumbersInput, setUnwantedNumbersInput] = useState<string>('');
  const [includeCoverage, setIncludeCoverage] = useState<boolean>(true);
  const [enabledTheories, setEnabledTheories] = useState<string[]>(LOTTERY_THEORIES.map(t => t.name));
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PredictionResult | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  
  // Developer Mode Manual API Key (Hidden by default)
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [manualApiKey, setManualApiKey] = useState('');

  // Monetization: Prediction Ready Modal
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    // Load existing dev key if present
    const storedKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
    if (storedKey) setManualApiKey(storedKey);
  }, []);

  const config = useMemo(() => {
    const base = GAME_CONFIGS[selectedGame];
    return selectedGame === LotteryGameType.CUSTOM ? { ...base, ...customParams } : base;
  }, [selectedGame, customParams]);

  const availableSystems = useMemo(() => {
    const min = (config.mainCount || 0) + 1;
    const systems: number[] = [];
    for (let i = min; i <= 20; i++) systems.push(i);
    return systems;
  }, [config.mainCount]);

  const gameGroups = useMemo(() => {
    const groups: Record<string, LotteryGameType[]> = {};
    (Object.values(LotteryGameType) as LotteryGameType[]).forEach(game => {
      const region = GAME_CONFIGS[game]?.region || 'Other';
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
  
  const handleSaveManualKey = () => {
      localStorage.setItem('gemini_api_key', manualApiKey);
      setShowDevSettings(false);
      setError(null);
  };

  const handlePredict = async () => {
    setIsAnalyzing(true);
    setError(null);
    setSavedStatus(false);
    setShowOfferModal(false);
    
    try {
      const sysNum = selectedSystem === 'standard' ? null : selectedSystem;
      
      const parseInputNumbers = (val: string): number[] => {
        return (val || '').split(',')
          .map((n: string) => parseInt(n.trim()))
          .filter((n: number) => !isNaN(n));
      };

      const prediction = await analyzeAndPredict(
        selectedGame, 
        historyText, 
        entryCount, 
        parseInputNumbers(luckyNumbersInput), 
        parseInputNumbers(unwantedNumbersInput),
        angelInput, 
        includeCoverage, 
        enabledTheories, 
        sysNum,
        selectedGame === LotteryGameType.CUSTOM ? customParams : undefined, 
        language
      );
      setResults(prediction);
      // Monetization: Show the "Ready" modal immediately after success
      setShowOfferModal(true);
    } catch (err: any) {
      if (err.message === "MISSING_SERVER_KEY") {
         setError("Server Configuration Missing. Please set API_KEY.");
         setShowDevSettings(true); 
      } else {
         setError(err.message || "Analysis failed. The server is busy or unreachable.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAll = () => {
    if (!results) return;
    const vaultEntry: SavedPrediction = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      game: selectedGame,
      numbers: results.entries,
      powerballs: results.powerballs,
      label: `AI Strategy (${results.strategicWeight}%)`,
      visualUrl: results.visualUrl
    };
    onSaveToVault(vaultEntry);
    setSavedStatus(true);
  };

  const handlePartnerClick = () => {
    if (BUY_LINKS[selectedGame]) {
        window.open(BUY_LINKS[selectedGame], '_blank');
    }
    setShowOfferModal(false);
  };

  const hasHistory = historyText.length > 50;
  const hasAffiliateLink = !!BUY_LINKS[selectedGame];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 space-y-6">
          {/* STEP 1: Market Selection */}
          <section className="glass-panel rounded-3xl p-6 shadow-2xl border-white/5 relative group/settings">
            
            {/* Secret Dev Settings Button (Top Right) */}
            <button 
                onClick={() => setShowDevSettings(true)} 
                className={`absolute top-6 right-6 p-1.5 rounded-lg transition-all opacity-0 group-hover/settings:opacity-100 ${manualApiKey ? 'bg-green-500/10 text-green-400' : 'text-gray-600 hover:text-gray-400'}`}
                title="Developer Settings"
            >
                <Settings className="w-3 h-3" />
            </button>

            <h2 className="text-lg font-black flex items-center gap-2 text-indigo-400 mb-4">
              <Globe className="w-5 h-5" /> {t('step1.title')}
            </h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {Object.entries(gameGroups).map(([region, games]) => (
                 <div key={region} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{region}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {(games as LotteryGameType[]).map((game) => (
                        <button key={game} onClick={() => { setSelectedGame(game); setResults(null); }} className={`text-left px-4 py-3 rounded-2xl border transition-all ${selectedGame === game ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-xl' : 'bg-gray-800/40 border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                          <div className="font-bold text-sm">{game}</div>
                          <div className="text-[9px] opacity-50 uppercase mt-0.5">{GAME_CONFIGS[game].description}</div>
                        </button>
                      ))}
                    </div>
                 </div>
              ))}
            </div>
          </section>

          {/* STEP 2: Data Feed */}
          <section className="glass-panel rounded-3xl p-6 shadow-2xl border-white/5">
            <h2 className="text-lg font-black flex items-center gap-2 text-indigo-400 mb-4">
              <Database className="w-5 h-5" /> {t('step2.title')}
            </h2>
            <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase">Feed Health</span>
                <span className={`text-xs font-black uppercase ${hasHistory ? 'text-green-400' : 'text-yellow-400'}`}>
                  {hasHistory ? t('step2.status.active') : t('step2.status.missing')}
                </span>
              </div>
              <button onClick={onOpenDataWizard} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all border border-gray-700">
                {t('step2.btn')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* STEP 3: Strategy Setup */}
          <section className="glass-panel rounded-3xl p-6 shadow-2xl border-white/5 space-y-6">
            <h2 className="text-lg font-black flex items-center gap-2 text-indigo-400">
              <Sliders className="w-5 h-5" /> {t('step3.title')}
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase">{t('lbl.volume')}</label>
                <input type="number" min="1" max="50" value={entryCount} onChange={(e) => setEntryCount(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-xs"/>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase">{t('lbl.system')}</label>
                <select value={selectedSystem} onChange={(e) => setSelectedSystem(e.target.value === 'standard' ? 'standard' : Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-xs">
                  <option value="standard">Standard</option>
                  {availableSystems.map(s => <option key={s} value={s}>System {s}</option>)}
                </select>
              </div>
            </div>

            {/* Core Theories */}
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Core Theories</label>
                <span className="text-[8px] text-gray-600 font-bold uppercase">{enabledTheories.length} Active</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LOTTERY_THEORIES.map((theory) => (
                  <button
                    key={theory.name}
                    onClick={() => toggleTheory(theory.name)}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all flex items-center gap-2 ${enabledTheories.includes(theory.name) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'}`}
                  >
                    {enabledTheories.includes(theory.name) && <ShieldCheck className="w-3 h-3" />}
                    {theory.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Win Coverage Strategy */}
            <div className="p-4 bg-indigo-900/10 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-white uppercase leading-none">{t('res.coverage')}</div>
                  <div className="text-[8px] text-gray-500 mt-1 uppercase">Spread optimization</div>
                </div>
              </div>
              <button 
                onClick={() => setIncludeCoverage(!includeCoverage)}
                className={`w-10 h-5 rounded-full relative transition-colors ${includeCoverage ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${includeCoverage ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {/* Number Filters */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-bold text-yellow-500/70 uppercase">{t('lbl.lucky')}</label>
                  <button onClick={onTestLuck} className="text-[8px] font-bold text-yellow-400 hover:underline flex items-center gap-1 uppercase">
                    <Dices className="w-2.5 h-2.5" /> {t('lbl.testLuck')}
                  </button>
                </div>
                <input type="text" placeholder="e.g. 7, 11, 23" value={luckyNumbersInput} onChange={(e) => setLuckyNumbersInput(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-xs"/>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-red-400/70 uppercase px-1">{t('lbl.ban')}</label>
                <input type="text" placeholder="Exclude e.g. 13, 4" value={unwantedNumbersInput} onChange={(e) => setUnwantedNumbersInput(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-xs"/>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-bold text-purple-400/80 uppercase">{t('lbl.angelHint')}</label>
                  <button onClick={onTestMoon} className="text-[8px] font-bold text-purple-400 hover:underline flex items-center gap-1 uppercase">
                    <Moon className="w-2.5 h-2.5" /> Moon Blocks
                  </button>
                </div>
                <input type="text" placeholder={t('ph.angelHint')} value={angelInput} onChange={(e) => setAngelInput(e.target.value)} className="w-full bg-purple-900/10 border border-purple-500/20 rounded-xl px-4 py-2.5 text-white text-xs"/>
              </div>
            </div>
          </section>
        </div>

        {/* STEP 4 & 5: Execution and Results */}
        <div className="lg:col-span-8 space-y-6">
          <section className="glass-panel rounded-3xl p-8 shadow-2xl min-h-[600px] border-white/5 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{t('res.title')}</h2>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">PRO Model v5.0 • Analytical Deep Dive</div>
              </div>
              {results && (
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={handleSaveAll} disabled={savedStatus} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${savedStatus ? 'bg-green-600/20 text-green-400 border border-green-500/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                    {savedStatus ? <CheckCircle2 className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {savedStatus ? 'Saved to Vault' : t('btn.vault')}
                  </button>
                  {BUY_LINKS[selectedGame] && (
                    <a href={BUY_LINKS[selectedGame]} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-2 shadow-lg shadow-green-600/20 animate-pulse">
                       {t('btn.playNow')} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {error && (
               <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300 font-bold">{error}</p>
                  </div>
               </div>
            )}

            {!results && !isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-32 text-center opacity-30">
                <Brain className="w-20 h-20 text-gray-600 mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t('res.waiting')}</p>
                <p className="text-[10px] text-gray-700 mt-2 max-w-xs uppercase">Select a game and configure your strategy to begin neural scanning.</p>
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-40">
                <div className="w-24 h-24 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-6" />
                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1">{t('res.analyzing')}</h3>
                <p className="text-[10px] text-indigo-400 font-mono italic animate-pulse">{t('res.sub')}</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results?.entries?.map((entry: number[], idx: number) => (
                    <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col gap-4 group hover:border-indigo-500/30 transition-all relative overflow-hidden">
                      {/* Ticket Decor */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#111827]"></div>
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#111827]"></div>

                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                           <Ticket className="w-4 h-4 text-indigo-400" />
                           <span className="text-[10px] font-black text-indigo-500 uppercase">Line {idx + 1}</span>
                        </div>
                        <div className="px-2 py-0.5 bg-indigo-500/10 rounded-md text-[8px] text-indigo-300 font-bold">STRENGTH: {results.strategicWeight}%</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {entry.sort((a,b) => a-b).map((num, n) => <NumberBall key={n} number={num} />)}
                        {results.powerballs && results.powerballs[idx] !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-px bg-white/10" />
                            <NumberBall number={results.powerballs[idx]} isPowerball />
                          </div>
                        )}
                      </div>
                      
                      {/* Direct Play Button Per Line - High Conversion */}
                      {BUY_LINKS[selectedGame] && (
                        <a 
                          href={BUY_LINKS[selectedGame]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 w-full py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-all transform group-hover:scale-[1.02]"
                        >
                           Play This Line <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* AD UNIT PLACEMENT: NATIVE SANDWICH */}
                {/* Placed between results and analysis for natural eye flow without interruption */}
                <AdUnit slot="MAIN_RESULT" format="horizontal" />

                <div className="p-8 bg-indigo-900/10 rounded-3xl border border-indigo-500/20 space-y-6">
                  <div className="flex items-center gap-3">
                    <Percent className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-xl font-black text-white uppercase">{t('res.tactical')}</h3>
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed font-medium">
                    {results?.analysis?.split('\n\n')?.map((p: string, i: number) => (
                      <p key={i} className="mb-4 bg-black/20 p-4 rounded-2xl border border-white/5">{p}</p>
                    ))}
                  </div>
                </div>

                {/* Theories Applied Badges */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {results?.theoriesApplied?.map((t: string) => (
                    <span key={t} className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-[9px] font-bold text-gray-500 uppercase">
                      {t} Applied
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Monetization: Prediction Ready Modal (Interstitial) */}
      {showOfferModal && BUY_LINKS[selectedGame] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="bg-gray-900 border border-indigo-500/50 rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl flex flex-col items-center text-center overflow-hidden">
                 
                 {/* Background Glow */}
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>

                 <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-bounce">
                     <CheckCircle2 className="w-10 h-10 text-green-400" />
                 </div>
                 
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 relative z-10">Strategy Generated</h2>
                 <p className="text-gray-400 text-sm mb-8 max-w-xs relative z-10">
                    The AI has successfully calculated {entryCount} high-probability lines for <strong>{selectedGame}</strong>.
                 </p>

                 <div className="w-full space-y-3 relative z-10">
                     <button 
                        onClick={handlePartnerClick}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-2xl font-black text-lg uppercase tracking-wide shadow-xl shadow-green-500/30 flex items-center justify-center gap-2 transition-transform hover:scale-105"
                     >
                        <Zap className="w-5 h-5 fill-current" /> Play These Numbers
                     </button>
                     
                     <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest pt-2">
                        Official Partner Link
                     </div>
                 </div>

                 <button 
                   onClick={() => setShowOfferModal(false)}
                   className="mt-6 text-gray-500 hover:text-white text-xs font-bold uppercase transition-colors"
                 >
                    View Analysis Only
                 </button>
             </div>
        </div>
      )}

      {/* Dev Settings Modal (Hidden unless activated) */}
      {showDevSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
             <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
                 <button onClick={() => setShowDevSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                 
                 <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-indigo-600 rounded-lg text-white">
                         <Settings className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-black text-white uppercase tracking-tight">Developer Mode</h3>
                 </div>

                 {error && error.includes("Missing") && (
                   <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400 font-bold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        Admin: The server API key is not configured. 
                        Please enter a key below to enable the app temporarily.
                      </div>
                   </div>
                 )}

                 <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                     Override server-side API key with a local testing key. Leave empty to use server default.
                 </p>

                 <div className="space-y-4">
                     <input 
                        type="password" 
                        value={manualApiKey}
                        onChange={(e) => setManualApiKey(e.target.value)}
                        placeholder="Paste Gemini API Key"
                        className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500"
                     />
                     <button onClick={handleSaveManualKey} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors shadow-lg">
                         <Save className="w-4 h-4" /> Save Configuration
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className={`fixed left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-50 transition-all duration-300 ${hasAffiliateLink ? 'bottom-20 pb-4' : 'bottom-0'}`}>
        <div className="max-w-xl mx-auto pointer-events-auto">
          <button onClick={handlePredict} disabled={isAnalyzing} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white font-black text-xl rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 transition-all group overflow-hidden">
            {isAnalyzing ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />}
            {isAnalyzing ? t('btn.processing') : t('btn.execute')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictorView;
