import React, { useState, useEffect, useRef } from 'react';
import { RingtoneType, BellSchedule, AppView, AppData } from './types';
import { getAudioFile } from './services/db';
import Dashboard from './components/Dashboard';
import RingtoneManager from './components/RingtoneManager';
import BellManager from './components/BellManager';
import DataTransfer from './components/DataTransfer';

// --- Web Worker Script ---
const createWorker = () => {
  const script = `
    let intervalId;
    self.onmessage = (e) => {
      if (e.data === 'start') {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => self.postMessage('tick'), 1000);
      } else if (e.data === 'stop') {
        clearInterval(intervalId);
      }
    };
  `;
  const blob = new Blob([script], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // --- State Initialization ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [ringtones, setRingtones] = useState<RingtoneType[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bell_ringtones') || '[]');
    } catch { return []; }
  });

  const [schedule, setSchedule] = useState<BellSchedule[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bell_schedule') || '[]');
    } catch { return []; }
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [lastPlayedMinute, setLastPlayedMinute] = useState<string>('');
  const [audioContextAllowed, setAudioContextAllowed] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const workerRef = useRef<Worker | null>(null);

  // --- Effects ---

  // Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Persistence
  useEffect(() => { localStorage.setItem('bell_ringtones', JSON.stringify(ringtones)); }, [ringtones]);
  useEffect(() => { localStorage.setItem('bell_schedule', JSON.stringify(schedule)); }, [schedule]);

  // Audio Engine (Web Worker)
  useEffect(() => {
    const workerUrl = createWorker();
    workerRef.current = new Worker(workerUrl);

    const checkTime = async () => {
      const now = new Date();
      const currentHM = now.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const seconds = now.getSeconds();

      if (seconds <= 1 && currentHM !== lastPlayedMinute) {
        const match = schedule.find(s => s.time === currentHM);
        if (match) {
          console.log(`[System] Triggering bell: ${match.name} at ${match.time}`);
          setLastPlayedMinute(currentHM);
          
          const type = ringtones.find(r => r.id === match.typeId);
          if (type) {
            try {
              const fileBlob = await getAudioFile(type.id);
              if (fileBlob) {
                const url = URL.createObjectURL(fileBlob);
                if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
                
                audioRef.current.src = url;
                audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.error("Playback failed (user interaction needed):", e));
                
                audioRef.current.onended = () => {
                    setIsPlaying(false);
                    URL.revokeObjectURL(url);
                };
              }
            } catch (err) {
              console.error("Audio retrieval error:", err);
            }
          }
        }
      }
    };

    workerRef.current.onmessage = checkTime;
    workerRef.current.postMessage('start');

    return () => {
      workerRef.current?.postMessage('stop');
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, [schedule, ringtones, lastPlayedMinute]);

  const stopAudio = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleImport = (data: AppData) => {
    setRingtones(data.ringtones);
    setSchedule(data.schedule);
  };

  const enableAudio = () => {
    const unlock = new Audio();
    unlock.play().catch(() => {});
    setAudioContextAllowed(true);
  };

  const NavButton = ({ view, icon, label }: { view: AppView, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
        currentView === view 
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold shadow-sm' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f3f3] dark:bg-[#020617] text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className={`${
          isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-10 opacity-0'
        } transition-all duration-300 ease-in-out bg-white dark:bg-[#0f172a] border-r border-gray-200 dark:border-slate-800 flex flex-col shadow-xl z-20 whitespace-nowrap overflow-hidden`}>
        
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
            </svg>
            <h1 className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">校园闹铃系统</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-1 font-mono">v3.5 (Win11 Pro)</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavButton 
            view={AppView.DASHBOARD} 
            label="系统仪表盘" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
          />
          <NavButton 
            view={AppView.RINGTONES} 
            label="铃声类型管理" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /></svg>} 
          />
          <NavButton 
            view={AppView.SCHEDULE} 
            label="闹铃计划管理" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0h18M5.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>} 
          />
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-[#0f172a]">
            <DataTransfer ringtones={ringtones} schedule={schedule} onImport={handleImport} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col transition-all duration-300">
         
         {/* Header */}
         <header className="h-14 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 flex items-center px-4 justify-between shrink-0 z-10 transition-colors">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
                
                {!isSidebarOpen && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 animate-[fadeIn_0.3s_ease-out]">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold text-lg text-slate-800 dark:text-white">校园闹铃系统</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                 <h2 className="text-base lg:text-lg font-medium text-gray-500 dark:text-gray-400 mr-4 hidden md:block">
                    {currentView === AppView.DASHBOARD && '系统仪表盘'}
                    {currentView === AppView.RINGTONES && '铃声类型管理'}
                    {currentView === AppView.SCHEDULE && '闹铃计划管理'}
                 </h2>

                 <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors"
                    title={isDarkMode ? "切换到白天模式" : "切换到黑夜模式"}
                 >
                    {isDarkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    )}
                 </button>
            </div>
         </header>

         {/* View Rendering */}
         <div className="flex-1 overflow-hidden relative">
            {!audioContextAllowed && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
                   <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md text-center animate-[fadeIn_0.5s_ease-out] border border-white/20">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                         </svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">启用音频播放</h2>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">为了确保自动铃声能够正常播放，浏览器需要您的授权。</p>
                      <button 
                        onClick={enableAudio}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:scale-105 transition-all"
                      >
                        开启系统
                      </button>
                   </div>
                </div>
             )}

             {currentView === AppView.DASHBOARD && <Dashboard schedule={schedule} ringtones={ringtones} />}
             {currentView === AppView.RINGTONES && <RingtoneManager ringtones={ringtones} setRingtones={setRingtones} />}
             {currentView === AppView.SCHEDULE && <BellManager schedule={schedule} setSchedule={setSchedule} ringtones={ringtones} />}
         </div>

         {/* Global Floating Audio Controls */}
         {isPlaying && (
             <div className="fixed bottom-8 right-8 z-50 animate-[slideIn_0.3s_ease-out]">
               <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200 dark:border-slate-700 p-2 rounded-full shadow-2xl flex items-center gap-3">
                 <div className="bg-green-500 text-white px-5 py-2.5 rounded-full flex items-center gap-3 shadow-inner">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span className="font-bold text-sm tracking-wide">播放中...</span>
                 </div>
                 <button
                   onClick={stopAudio}
                   className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 mr-1"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                     <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-8.5z" />
                   </svg>
                   停止
                 </button>
               </div>
             </div>
         )}
      </main>
    </div>
  );
};

export default App;