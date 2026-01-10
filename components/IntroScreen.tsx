
import React, { useEffect } from 'react';

interface IntroScreenProps {
  onFinish: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // 3.5초 후 자동으로 메인 화면으로 전환
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-red-700 via-red-600 to-orange-500 flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 border-2 border-white rounded-full opacity-50"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white rounded-full animate-ping delay-700"></div>
      </div>
      
      <div className="relative z-10 text-center space-y-8 px-6">
        <div className="flex justify-center">
          <div className="text-9xl gallop-anim drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]">🐎</div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-5xl font-bold font-gaegu tracking-tighter drop-shadow-lg animate-pulse">2026 병오년</h1>
          <p className="text-2xl font-gaegu opacity-90">붉은 말의 해, 소원 질주</p>
        </div>

        <div className="pt-10 flex flex-col items-center gap-4">
          <button 
            onClick={onFinish}
            className="px-10 py-4 bg-white text-red-600 rounded-full font-bold text-xl shadow-2xl hover:bg-red-50 hover:scale-105 active:scale-95 transition-all"
          >
            시작하기 히히힝!
          </button>
          <p className="text-xs opacity-70 animate-pulse">잠시 후 자동으로 시작됩니다...</p>
        </div>
      </div>

      <div className="absolute bottom-10 text-[10px] opacity-60 uppercase tracking-widest font-bold">
        Designed for Korea 2026 New Year
      </div>
    </div>
  );
};

export default IntroScreen;
