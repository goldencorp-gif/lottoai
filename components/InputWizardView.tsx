
import React, { useState, useEffect, useMemo } from 'react';
import { LotteryGameType } from '../types';
import { fetchLatestDraws } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  RefreshCw, ArrowLeft, 
  Trash2, Save, Loader2, Link as LinkIcon, Settings, X, AlertCircle, Sparkles,
  FileText, Type, AlignJustify
} from 'lucide-react';

interface InputWizardViewProps {
  game: LotteryGameType;
  currentData: string;
  onSave: (data: string) => void;
  onCancel: () => void;
}

const InputWizardView: React.FC<InputWizardViewProps> = ({ game, currentData, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [localData, setLocalData] = useState<string>(currentData);
  const [sources, setSources] = useState<{ title: string, uri: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'error' | 'success' | 'info', textKey: string} | null>(null);

  // Settings State
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [manualApiKey, setManualApiKey] = useState('');

  useEffect(() => {
    // Load existing dev key
    const storedKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
    if (storedKey) setManualApiKey(storedKey);
  }, []);

  const handleSaveManualKey = () => {
    localStorage.setItem('gemini_api_key', manualApiKey);
    setShowDevSettings(false);
    setStatusMessage(null);
  };

  const handleFetch = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await fetchLatestDraws(game);
      setLocalData(result.data);
      setSources(result.sources);
      
      if (result.isSimulated) {
        setStatusMessage({
            type: 'info', 
            textKey: 'wlz.msg.info'
        });
      } else {
         setStatusMessage({
            type: 'success',
            textKey: 'wlz.msg.success'
         });
      }
    } catch (e: any) {
        setStatusMessage({
            type: 'error',
            textKey: 'wlz.msg.error'
        });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const text = localData || '';
    return {
        lines: text ? text.split('\n').length : 0,
        words: text.trim() ? text.trim().split(/\s+/).length : 0,
        chars: text.length
    };
  }, [localData]);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="glass-panel rounded-3xl p-8 border-white/5 min-h-[80vh] flex flex-col relative overflow-hidden group/settings">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        {/* Settings Trigger */}
        <button 
            onClick={() => setShowDevSettings(true)} 
            className={`absolute top-6 right-6 p-2 rounded-lg transition-all z-20 ${manualApiKey ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
            title={t('settings.title')}
        >
            <Settings className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between mb-8 relative z-10 pr-12">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors group">
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t('wlz.title')}</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('wlz.desc')} {game}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
          <div className="space-y-6">
            <div className="p-6 bg-gray-900/40 rounded-3xl border border-gray-800">
              <h3 className="text-sm font-black text-white uppercase mb-4">{t('wlz.autosync')}</h3>
              <p className="text-[10px] text-gray-500 mb-6 leading-relaxed">
                {t('wlz.autosyncDesc')}
              </p>
              <button onClick={handleFetch} disabled={isLoading} className={`w-full py-4 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 transition-all ${isLoading ? 'bg-gray-800 text-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl'}`}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {isLoading ? t('wlz.syncing') : t('wlz.sync')}
              </button>
              
              {statusMessage && (
                 <div className={`mt-4 pt-4 border-t border-gray-800 animate-in fade-in flex gap-2 ${statusMessage.type === 'error' ? 'text-red-400' : statusMessage.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                    <div className="shrink-0 mt-0.5">
                        {statusMessage.type === 'info' ? <Sparkles className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                    </div>
                    <p className="text-[10px] leading-relaxed font-medium">
                        {t(statusMessage.textKey)}
                    </p>
                 </div>
              )}
            </div>

            {sources.length > 0 && (
              <div className="p-6 bg-indigo-900/10 rounded-3xl border border-indigo-500/20">
                <h3 className="text-xs font-black text-indigo-400 uppercase mb-3 flex items-center gap-2">
                  <LinkIcon className="w-3 h-3" /> {t('wlz.sources')}
                </h3>
                <div className="space-y-2">
                  {sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="block p-2 bg-black/20 rounded-lg text-[10px] text-gray-400 hover:text-white border border-white/5 transition-colors truncate">
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col relative">
             <div className="absolute top-2 right-2 z-10">
                 <button onClick={() => setLocalData('')} className="px-3 py-1.5 bg-gray-900/80 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 transition-colors border border-white/5 backdrop-blur-sm shadow-lg">
                    <Trash2 className="w-3 h-3" /> {t('wlz.clear')}
                </button>
             </div>
             
             <div className="bg-black/40 border border-gray-800 rounded-3xl flex flex-col flex-grow overflow-hidden relative shadow-inner">
                 <textarea 
                    value={localData} 
                    onChange={(e) => setLocalData(e.target.value)} 
                    placeholder={t('wlz.placeholder')} 
                    className="w-full flex-grow bg-transparent p-6 text-sm font-mono text-gray-300 resize-none outline-none placeholder:text-gray-800 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
                 />
                 
                 {/* Statistical Footer */}
                 <div className="px-6 py-3 bg-gray-900/50 border-t border-white/5 flex items-center justify-end gap-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest select-none backdrop-blur-sm">
                     <div className="flex items-center gap-2" title="Lines">
                        <AlignJustify className="w-3 h-3 text-indigo-500/50" />
                        <span>{stats.lines} Lines</span>
                     </div>
                     <div className="flex items-center gap-2" title="Words">
                        <FileText className="w-3 h-3 text-purple-500/50" />
                        <span>{stats.words} Words</span>
                     </div>
                     <div className="flex items-center gap-2" title="Characters">
                        <Type className="w-3 h-3 text-blue-500/50" />
                        <span>{stats.chars} Chars</span>
                     </div>
                 </div>
             </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex justify-end">
          <button onClick={() => onSave(localData)} className="py-4 px-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg uppercase shadow-xl hover:scale-105 transition-transform">
            <Save className="w-5 h-5 mr-2 inline" /> {t('wlz.save')}
          </button>
        </div>
      </div>

      {/* Internal Settings Modal for Wizard */}
      {showDevSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
             <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
                 <button onClick={() => setShowDevSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                 
                 <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-indigo-600 rounded-lg text-white">
                         <Settings className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-black text-white uppercase tracking-tight">{t('settings.title')}</h3>
                 </div>

                 <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      {t('settings.wizardHint')}
                    </div>
                 </div>

                 <div className="space-y-4">
                     <input 
                        type="password" 
                        value={manualApiKey}
                        onChange={(e) => setManualApiKey(e.target.value)}
                        placeholder={t('settings.label')}
                        className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500"
                     />
                     <button onClick={handleSaveManualKey} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors shadow-lg">
                         <Save className="w-4 h-4" /> {t('settings.save')}
                     </button>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default InputWizardView;
