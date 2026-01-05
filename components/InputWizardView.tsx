
import React, { useState } from 'react';
import { LotteryGameType } from '../types';
import { fetchLatestDraws } from '../services/geminiService';
import { 
  Database, RefreshCw, CheckCircle2, ArrowLeft, 
  Trash2, FileText, AlertCircle, Save, ExternalLink, Search, Zap, Loader2
} from 'lucide-react';
import { GAME_CONFIGS } from '../constants';

interface InputWizardViewProps {
  game: LotteryGameType;
  currentData: string;
  onSave: (data: string) => void;
  onCancel: () => void;
}

const InputWizardView: React.FC<InputWizardViewProps> = ({ game, currentData, onSave, onCancel }) => {
  const [localData, setLocalData] = useState<string>(currentData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Small delay to let user see the loading state immediately
      await new Promise(r => setTimeout(r, 100));
      const result = await fetchLatestDraws(game);
      setLocalData(result);
    } catch (e: any) {
      setError(e.message || "Failed to fetch data. Please try again or use manual verify.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = () => {
    const query = encodeURIComponent(`${game} latest official draw results numbers`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const handleClear = () => setLocalData('');

  const handleDemoData = () => {
    const config = GAME_CONFIGS[game];
    const lines = [];
    const today = new Date();
    
    // Generate 5 plausible dummy lines for immediate use
    for(let i=0; i<5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - ((i+1) * 7)); // Weekly draws
        
        // Random main numbers
        const main = Array.from({length: config.mainCount}, () => Math.floor(Math.random() * config.mainRange) + 1)
          .sort((a,b) => a-b)
          .join(', ');
        
        let extra = '';
        if (config.bonusCount > 0 && config.bonusRange) {
           const bonus = Array.from({length: config.bonusCount}, () => Math.floor(Math.random() * config.bonusRange!) + 1).join(', ');
           extra = ` (+ ${bonus})`;
        } else if (config.bonusCount > 0) {
           // Standard bonus from main pool
           const bonus = Array.from({length: config.bonusCount}, () => Math.floor(Math.random() * config.mainRange) + 1).join(', ');
           extra = ` (Supp: ${bonus})`;
        }

        lines.push(`Draw ${date.toLocaleDateString()}: ${main}${extra}`);
    }
    
    setLocalData(lines.join('\n'));
    setError(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="glass-panel rounded-3xl p-8 border-white/5 min-h-[80vh] flex flex-col relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={onCancel}
              className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-500" /> Data Intelligence Hub
              </h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                External Data Management for {game}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleClear}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
          {/* Left Column: Actions */}
          <div className="space-y-6">
            <div className="p-6 bg-gray-900/40 rounded-3xl border border-gray-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Auto-Sync (AI)</h3>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                Uses Google Gemini to browse the web and extract the latest 10 draw results for <strong>{game}</strong>.
              </p>
              <button 
                onClick={handleFetch}
                disabled={isLoading}
                className={`
                  w-full py-4 rounded-xl font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg
                  ${isLoading 
                    ? 'bg-gray-800 text-gray-400 cursor-wait' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}
                `}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {isLoading ? 'AI Browsing Web...' : 'Auto-Sync Latest Results'}
              </button>
              {isLoading && (
                 <div className="mt-3 text-[10px] text-center text-blue-400 animate-pulse">
                    Please wait while the AI searches official sources...
                 </div>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-900/40 rounded-3xl border border-gray-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Instant Access</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Don't want to wait? Load sample data to test the AI strategy engine immediately.
              </p>
              <button 
                onClick={handleDemoData}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 border border-gray-700 hover:border-green-500/50 transition-colors"
              >
                <Zap className="w-4 h-4" /> Load Demo Data
              </button>
            </div>

            <div className="p-6 bg-gray-900/40 rounded-3xl border border-gray-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Manual Verification</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Always verify AI-fetched data against official sources. Click below to open a live search check.
              </p>
              <button 
                onClick={handleVerify}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-indigo-400 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 border border-gray-700 hover:border-indigo-500/50 transition-colors"
              >
                <Search className="w-4 h-4" /> Verify on Google
              </button>
            </div>

            <div className="p-4 bg-gray-900/20 rounded-2xl border border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold">Status</span>
                <span className={`text-xs font-bold ${localData.length > 50 ? 'text-green-400' : 'text-yellow-500'}`}>
                  {localData.length > 50 ? 'Ready for Analysis' : 'Insufficient Data'}
                </span>
            </div>
          </div>

          {/* Right Column: Editor */}
          <div className="lg:col-span-2 flex flex-col">
             <div className="flex-grow bg-black/40 border border-gray-800 rounded-3xl p-1 flex flex-col relative group focus-within:border-indigo-500/50 transition-colors">
                <div className="absolute top-4 right-4 p-2 bg-gray-900 rounded-lg opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <textarea
                  value={localData}
                  onChange={(e) => setLocalData(e.target.value)}
                  placeholder={`Paste historical results here manually if fetch is slow...\n\nFormat Example:\nDraw 1234: 1, 2, 3, 4, 5, 6\nDraw 1235: 10, 20, 30, 40, 50, 60`}
                  className="w-full h-full bg-transparent p-6 text-sm font-mono text-gray-300 resize-none outline-none placeholder:text-gray-700"
                />
             </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex justify-end">
          <button 
            onClick={() => onSave(localData)}
            className="py-4 px-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg uppercase tracking-wide flex items-center gap-3 shadow-xl shadow-indigo-600/20 hover:transform hover:-translate-y-1 transition-all"
          >
            <Save className="w-5 h-5" /> Apply & Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputWizardView;
