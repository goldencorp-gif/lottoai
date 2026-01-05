
import React, { useEffect, useState } from 'react';
import { Brain, PlayCircle, BookOpen, Globe, Download, Share2, Coffee } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../types';
import { DONATION_LINK } from '../constants';

type ViewType = 'predictor' | 'simulator' | 'guide';

interface NavigationProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const { language, setLanguage, t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture the PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'AI Power Draw',
        text: 'Check out this AI Lottery Predictor!',
        url: window.location.href,
      });
    } else {
      alert("Link copied to clipboard!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDonate = () => {
    window.open(DONATION_LINK, '_blank');
  };

  return (
    <nav className="flex flex-wrap justify-between items-center mb-8 px-4 py-2 gap-4">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('predictor')}>
         {/* Custom Logo Handling with Fallback */}
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
         
         <span className="font-black text-white tracking-tighter text-lg uppercase hidden md:inline group-hover:text-indigo-400 transition-colors">
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
          onClick={() => setView('guide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${currentView === 'guide' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">{t('nav.strategies')}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Donation Button */}
        <button 
          onClick={handleDonate}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/20 text-xs font-bold uppercase transition-colors"
          title={t('nav.support')}
        >
          <Coffee className="w-4 h-4" />
          <span className="hidden sm:inline">{t('nav.support')}</span>
        </button>

        {/* Install App Button (Only visible if installable) */}
        {deferredPrompt && !isInstalled && (
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 text-xs font-bold uppercase transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">App</span>
          </button>
        )}

        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="p-2 bg-gray-900 rounded-xl border border-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <div className="relative group z-50">
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-xl border border-gray-800 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase">
            <Globe className="w-4 h-4" />
            <span>{language.toUpperCase()}</span>
          </button>
          <div className="absolute top-full right-0 mt-2 w-32 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
             <button onClick={() => setLanguage('en')} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-800 ${language === 'en' ? 'text-indigo-400' : 'text-gray-400'}`}>English</button>
             <button onClick={() => setLanguage('zh')} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-800 ${language === 'zh' ? 'text-indigo-400' : 'text-gray-400'}`}>中文</button>
             <button onClick={() => setLanguage('es')} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-800 ${language === 'es' ? 'text-indigo-400' : 'text-gray-400'}`}>Español</button>
             <button onClick={() => setLanguage('hi')} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-800 ${language === 'hi' ? 'text-indigo-400' : 'text-gray-400'}`}>हिन्दी</button>
             <button onClick={() => setLanguage('vi')} className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-800 ${language === 'vi' ? 'text-indigo-400' : 'text-gray-400'}`}>Tiếng Việt</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
