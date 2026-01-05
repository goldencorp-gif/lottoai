
import React from 'react';

interface NumberBallProps {
  number: number;
  isBonus?: boolean;
  isPowerball?: boolean;
}

const NumberBall: React.FC<NumberBallProps> = ({ number, isBonus, isPowerball }) => {
  let bgColor = 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/50';
  
  if (isPowerball) {
    bgColor = 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-900 shadow-[0_0_15px_rgba(255,255,255,0.4)] border-gray-100';
  } else if (isBonus) {
    bgColor = 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-orange-500/50';
  }

  return (
    <div className={`
      w-10 h-10 md:w-12 md:h-12 
      rounded-full flex items-center justify-center 
      ${isPowerball ? 'font-black' : 'font-bold'} text-lg md:text-xl
      shadow-lg border border-white/20
      ball-glow
      ${isPowerball ? 'text-gray-900' : 'text-white'}
      ${bgColor}
      transition-transform hover:scale-110
    `}>
      {number}
    </div>
  );
};

export default NumberBall;
