
import React from 'react';
import { ShieldAlert, ExternalLink, Info, Coffee } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AdUnit from './AdUnit';
import { DONATION_LINK } from '../constants';
import { AD_SLOTS } from '../constants/ads';

interface CommercialNoticeProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

const CommercialNotice: React.FC<CommercialNoticeProps> = ({ onOpenPrivacy, onOpenTerms }) => {
  const { t } = useLanguage();

  return (
    <div className="mt-20 border-t border-gray-800 pt-10 pb-20 px-6 text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Donation CTA */}
        <div className="flex flex-col items-center justify-center space-y-3 mb-8 p-6 bg-yellow-900/10 border border-yellow-500/20 rounded-2xl">
           <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-400">
              <Coffee className="w-6 h-6" />
           </div>
           <p className="text-sm text-gray-300 max-w-md mx-auto">
             {t('notice.tip')}
           </p>
           <a 
             href={DONATION_LINK} 
             target="_blank" 
             rel="noopener noreferrer"
             className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-xs font-bold uppercase tracking-wide transition-colors shadow-lg shadow-yellow-600/20"
           >
             {t('btn.donate')}
           </a>
        </div>

        {/* Ad Unit in Footer */}
        <div className="mb-8">
            <AdUnit slot="FOOTER" format="horizontal" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-widest">
            <ShieldAlert className="w-3 h-3" /> {t('notice.responsible')}
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest">
            <Info className="w-3 h-3" /> Independent Service
          </div>
        </div>
        
        <div className="space-y-3 text-left md:text-center bg-gray-900/50 p-6 rounded-2xl border border-white/5">
            <p className="text-gray-500 text-xs leading-relaxed italic">
            {t('notice.text')}
            </p>
            
            <div className="h-px bg-white/10 w-full my-2"></div>

            <p className="text-gray-600 text-[10px] leading-relaxed">
                <strong>1. Game Ownership:</strong> All lottery game names and trademarks used in this application (such as "Powerball", "Mega Millions", "EuroMillions") remain the property of their respective owners. This application is an independent statistical tool and is <strong>not affiliated with</strong>, endorsed by, or connected to any official lottery operator.
            </p>
            <p className="text-gray-600 text-[10px] leading-relaxed">
                <strong>2. Retail Service:</strong> The "Play Now" links in this application direct you to our authorized lottery partner, such as <strong>The Lottery Office</strong>. We may receive a commission if you purchase tickets via these links. Please note that products offered by international lottery matching services may differ in structure from government lotteries in your region.
            </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          <a href="https://www.gambleaware.com.au" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 flex items-center gap-1 transition-colors">
            Gamble Aware <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-gray-700">|</span>
          <button onClick={onOpenPrivacy} className="hover:text-blue-400 transition-colors cursor-pointer">Privacy Policy</button>
          <span className="text-gray-700">|</span>
          <button onClick={onOpenTerms} className="hover:text-blue-400 transition-colors cursor-pointer">Terms of Service</button>
          <span className="text-gray-700">|</span>
          <span>Version 1.4.0 (Global)</span>
        </div>

        <div className="text-[40px] font-black text-gray-800 opacity-20 select-none">
          18+ ONLY
        </div>
      </div>
    </div>
  );
};

export default CommercialNotice;
