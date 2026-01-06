import React, { useEffect, useState } from 'react';
import { Brain, PlayCircle, BookOpen, Globe, Download, Share2, Coffee, Bookmark, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { DONATION_LINK } from '../constants';

type ViewType = 'predictor' | 'simulator' | 'guide' | 'vault';

interface NavigationProps {
  currentView: ViewType;
  setView: (view: any) => void;
  onOpenSettings: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, onOpenSettings }) => {
  const { language, setLanguage, t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Lotto AI',
        text: 'Check out this AI Lottery Predictor!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  };

  return (
    <nav className="flex flex-wrap justify-between items-center mb-8 px-4 py-2 gap-4">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('predictor')}>
         {!logoError ? (
           <img 
             src="/logo.png" 
             alt="Lotto AI" 
             className="h-10 w-auto object-contain transition-transform group-hover:scale-105" 
             onError={() => setLogoError(true)}
           />
         ) : (
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
             <Brain className="w-5 h-5 text-white" />
           </div>
         )}
         <span className="font-black text-white tracking-tighter text-lg uppercase hidden md:inline">
           {t('app.title')}
         </span>
      </div>
      
      <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-800 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setView('predictor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${currentView === 'predictor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Brain className="w-4 h-4" />
          <span className="hidden sm:inline">{t('nav.predict')}</span>
        </button>
        <button 
          onClick={() => setView('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all relative whitespace-nowrap ${currentView === 'simulator' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <PlayCircle className="w-4 h-4" />
          <span className="hidden sm:inline">{t('nav.simulator')}</span>
        </button>
        <button 
          onClick={() => setView('vault')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all relative whitespace-nowrap ${currentView === 'vault' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Vault</span>
        </button>
        <button 
          onClick={() => setView('guide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${currentView === 'guide' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">{t('nav.strategies')}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => window.open(DONATION_LINK, '_blank')}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/20 text-xs font-bold uppercase transition-colors"
        >
          <Coffee className="w-4 h-4" />
          <span className="hidden sm:inline">{t('nav.support')}</span>
        </button>

        {deferredPrompt && !isInstalled && (
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 text-xs font-bold uppercase transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">App</span>
          </button>
        )}

        <button onClick={handleShare} className="p-2 bg-gray-900 rounded-xl border border-gray-800 text-gray-400 hover:text-white transition-colors">
          <Share2 className="w-4 h-4" />
        </button>

        <button 
          onClick={onOpenSettings}
          className="p-2 bg-gray-900 rounded-xl border border-gray-800 text-gray-400 hover:text-white transition-colors group"
          title="API Settings"
        >
          <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
        </button>

        <div className="relative group z-50">
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-xl border border-gray-800 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase">
            <Globe className="w-4 h-4" />
            <span>{language.toUpperCase()}</span>
          </button>
          <div className="absolute top-full right-0 mt-2 w-32 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
             {['en', 'zh', 'es', 'hi', 'vi'].map(lang => (
               <button key={lang} onClick={() => setLanguage(lang as any)} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-800 ${language === lang ? 'text-indigo-400' : 'text-gray-400'}`}>
                 {lang === 'en' ? 'English' : lang === 'zh' ? '中文' : lang === 'es' ? 'Español' : lang === 'hi' ? 'हिन्दी' : 'Tiếng Việt'}
               </button>
             ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;