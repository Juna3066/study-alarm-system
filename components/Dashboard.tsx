import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BellSchedule, RingtoneType } from '../types';

interface DashboardProps {
  schedule: BellSchedule[];
  ringtones: RingtoneType[];
}

const Dashboard: React.FC<DashboardProps> = ({ schedule, ringtones }) => {
  const [now, setNow] = useState(new Date());
  
  // Refs for auto-scrolling
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Timer runs every second to update UI
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Memoize sorted schedule to avoid recalculation on every second tick
  const sortedSchedule = useMemo(() => {
    return [...schedule].sort((a, b) => {
      const [h1, m1] = a.time.split(':').map(Number);
      const [h2, m2] = b.time.split(':').map(Number);
      return (h1 * 60 + m1) - (h2 * 60 + m2);
    });
  }, [schedule]);

  // 2. Efficiently find current and next bell
  const { currentBell, nextBell } = useMemo(() => {
    const currentTimeValue = now.getHours() * 60 + now.getMinutes();
    
    let currentIndex = -1;
    for (let i = 0; i < sortedSchedule.length; i++) {
      const [h, m] = sortedSchedule[i].time.split(':').map(Number);
      if (h * 60 + m <= currentTimeValue) {
        currentIndex = i;
      } else {
        break;
      }
    }

    return {
      currentBell: currentIndex !== -1 ? sortedSchedule[currentIndex] : null,
      nextBell: currentIndex + 1 < sortedSchedule.length 
        ? sortedSchedule[currentIndex + 1] 
        : (sortedSchedule.length > 0 && currentIndex === -1 ? sortedSchedule[0] : null)
    };
  }, [now, sortedSchedule]);

  // 3. Auto-scroll effect
  useEffect(() => {
    const targetId = currentBell?.id || nextBell?.id;
    if (targetId) {
      const element = rowRefs.current.get(targetId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentBell?.id, nextBell?.id]);

  const formatDate = (date: Date) => date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const formatTime = (date: Date) => date.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const getRingtoneName = (typeId: string) => ringtones.find(r => r.id === typeId)?.name || '未知类型';

  return (
    <div className="p-4 sm:p-6 h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      
      {/* Left: Schedule List */}
      <div className="lg:col-span-5 glass-panel rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col overflow-hidden h-full border-t-4 border-blue-500 dark:bg-slate-800/90 dark:border-blue-600">
        <h3 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 border-b pb-4 border-gray-200 dark:border-slate-700">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400">
             <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
           </svg>
           作息时间表
        </h3>
        <div className="flex-1 overflow-y-auto pr-2 scroll-smooth">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm z-10 shadow-sm">
              <tr className="text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-slate-700">
                <th className="pb-3 pl-2 font-medium">时间</th>
                <th className="pb-3 font-medium">名称</th>
                <th className="pb-3 text-right pr-2 font-medium">类型</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
               {sortedSchedule.length === 0 && (
                 <tr><td colSpan={3} className="text-center py-10 text-gray-400 dark:text-gray-500">暂无计划</td></tr>
               )}
               {sortedSchedule.map((bell) => {
                 const isCurrent = currentBell?.id === bell.id;
                 const isNext = nextBell?.id === bell.id;
                 return (
                   <tr 
                     key={bell.id} 
                     ref={(el) => { if (el) rowRefs.current.set(bell.id, el); else rowRefs.current.delete(bell.id); }}
                     className={`
                     transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-700/50
                     ${isCurrent ? 'bg-blue-100/60 dark:bg-blue-900/40' : ''} 
                     ${isNext ? 'bg-green-100/60 dark:bg-green-900/40' : ''}
                   `}>
                     <td className="py-3 pl-2 font-mono font-bold text-gray-700 dark:text-gray-200 text-base sm:text-lg">{bell.time}</td>
                     <td className="py-3 font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">
                       <div className="flex flex-col">
                         <span>{bell.name}</span>
                         <div className="flex gap-1 mt-1">
                            {isCurrent && <span className="text-[10px] bg-blue-500 dark:bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold shadow-sm">当前</span>}
                            {isNext && <span className="text-[10px] bg-green-500 dark:bg-green-600 text-white px-1.5 py-0.5 rounded font-bold shadow-sm">下个</span>}
                         </div>
                       </div>
                     </td>
                     <td className="py-3 text-right text-sm text-gray-500 dark:text-gray-400 pr-2">
                       <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs border border-gray-200 dark:border-slate-600">{getRingtoneName(bell.typeId)}</span>
                     </td>
                   </tr>
                 )
               })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Cards */}
      <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6 h-full overflow-y-auto pb-2">
        
        {/* Clock Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg text-center border-t-4 border-indigo-500 bg-gradient-to-br from-white to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/30 dark:border-indigo-600 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 text-indigo-900 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-32 h-32 sm:w-48 sm:h-48">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
           <h2 className="text-lg sm:text-2xl lg:text-3xl text-gray-500 dark:text-gray-400 font-light mb-2 tracking-wide">{formatDate(now)}</h2>
           <div className="relative z-10">
             <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter tabular-nums leading-none mt-2 drop-shadow-sm">
               {formatTime(now)}
             </h1>
           </div>
        </div>

        {/* Current Segment Card */}
        <div className={`glass-panel rounded-2xl p-4 sm:p-6 shadow-md border-l-8 transition-all duration-500 relative overflow-hidden
            ${currentBell ? 'border-blue-500 bg-white dark:bg-slate-800 dark:border-blue-500' : 'border-gray-300 bg-gray-50/50 dark:border-slate-600 dark:bg-slate-800/50'}`}>
             
             {/* Background Icon */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 sm:w-32 sm:h-32 text-blue-900 dark:text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
             </div>

             <div className="flex items-center justify-between mb-4 relative z-10">
               <h3 className="text-lg sm:text-xl font-bold text-gray-600 dark:text-gray-300 flex items-center gap-3">
                  <span className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm ${currentBell ? 'bg-blue-500 animate-pulse' : 'bg-gray-300 dark:bg-slate-600'}`}></span>
                  当前时段
               </h3>
               {currentBell && <span className="text-base sm:text-lg font-mono text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 sm:px-4 rounded-full font-bold shadow-sm">{currentBell.time}</span>}
             </div>

             {currentBell ? (
               <div className="pl-4 sm:pl-7 relative z-10">
                 <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-white break-words">{currentBell.name}</div>
                 <div className="mt-3 text-gray-500 dark:text-gray-400 text-sm sm:text-lg flex items-center gap-2 font-medium">
                   <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs sm:text-sm border border-gray-200 dark:border-slate-600">
                     类型: {getRingtoneName(currentBell.typeId)}
                   </span>
                 </div>
               </div>
             ) : (
               <div className="text-gray-400 dark:text-gray-500 italic py-6 flex items-center justify-center relative z-10 text-sm sm:text-base">
                 当前无活动闹铃时段（等待今日首个闹铃）
               </div>
             )}
        </div>

        {/* 3. 下个闹铃段 */}
        <div className={`glass-panel rounded-2xl p-4 sm:p-6 shadow-md border-l-8 transition-all duration-500 relative overflow-hidden
            ${nextBell ? 'border-green-500 bg-white dark:bg-slate-800 dark:border-green-500' : 'border-gray-300 bg-gray-50/50 dark:border-slate-600 dark:bg-slate-800/50'}`}>
             
             {/* Background Icon */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 sm:w-32 sm:h-32 text-green-900 dark:text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
             </div>

             <div className="flex items-center justify-between mb-4 relative z-10">
               <h3 className="text-lg sm:text-xl font-bold text-gray-600 dark:text-gray-300 flex items-center gap-3">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 shadow-sm"></span>
                  下个时段
               </h3>
                {nextBell && <span className="text-base sm:text-lg font-mono text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-3 py-1 sm:px-4 rounded-full font-bold shadow-sm">{nextBell.time}</span>}
             </div>

              {nextBell ? (
               <div className="pl-4 sm:pl-7 relative z-10">
                 <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white opacity-90 break-words">{nextBell.name}</div>
                 <div className="mt-3 text-gray-500 dark:text-gray-400 text-sm sm:text-lg flex items-center gap-2 font-medium">
                    <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs sm:text-sm border border-gray-200 dark:border-slate-600">
                     类型: {getRingtoneName(nextBell.typeId)}
                   </span>
                 </div>
               </div>
             ) : (
               <div className="text-gray-400 dark:text-gray-500 italic py-6 flex items-center justify-center relative z-10 text-sm sm:text-base">
                 今日计划已全部完成
               </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;