import React, { useEffect, useState } from 'react';
import { BellSchedule, RingtoneType } from '../types';

interface DashboardProps {
  schedule: BellSchedule[];
  ringtones: RingtoneType[];
}

const Dashboard: React.FC<DashboardProps> = ({ schedule, ringtones }) => {
  const [now, setNow] = useState(new Date());
  const [currentBell, setCurrentBell] = useState<BellSchedule | null>(null);
  const [nextBell, setNextBell] = useState<BellSchedule | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 算法实现：
  // 1. 界面左右布局
  // 2. 当前所处闹铃段（算法：第一个小于等于当前时间的闹铃 -> 在升序列表中即为最后一个满足条件的）
  // 3. 下个闹铃段（算法：按时间升序排序后，当前所处闹铃段后的下一个闹铃）
  useEffect(() => {
    const currentTimeValue = now.getHours() * 60 + now.getMinutes();

    // 1. 按时间升序排序
    const sortedSchedule = [...schedule].sort((a, b) => {
      const [h1, m1] = a.time.split(':').map(Number);
      const [h2, m2] = b.time.split(':').map(Number);
      return (h1 * 60 + m1) - (h2 * 60 + m2);
    });

    let foundCurrentIndex = -1;

    // 2. 寻找当前所处闹铃段 (找到最后一个 时间 <= 当前时间 的闹铃)
    // 例如：当前8:30。列表 8:00, 9:00。
    // 8:00 <= 8:30 (match index 0)
    // 9:00 > 8:30
    // 结果：Current is 8:00
    for (let i = 0; i < sortedSchedule.length; i++) {
      const bell = sortedSchedule[i];
      const [h, m] = bell.time.split(':').map(Number);
      const bellTimeValue = h * 60 + m;

      if (bellTimeValue <= currentTimeValue) {
        foundCurrentIndex = i;
      } else {
        // 一旦超过当前时间，后面的都不符合“小于等于”，因为列表是有序的
        break;
      }
    }

    const foundCurrent = foundCurrentIndex !== -1 ? sortedSchedule[foundCurrentIndex] : null;

    // 3. 寻找下个闹铃段
    let foundNext = null;
    if (foundCurrentIndex !== -1) {
      // 如果找到了当前段，下一个就是 index + 1
      if (foundCurrentIndex + 1 < sortedSchedule.length) {
        foundNext = sortedSchedule[foundCurrentIndex + 1];
      }
    } else {
      // 如果没找到当前段（说明当前时间早于所有闹铃），那么下一个就是列表的第一个
      if (sortedSchedule.length > 0) {
        foundNext = sortedSchedule[0];
      }
    }

    setCurrentBell(foundCurrent);
    setNextBell(foundNext);

  }, [now, schedule]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { // en-GB uses 24h format by default
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getRingtoneName = (typeId: string) => {
    return ringtones.find(r => r.id === typeId)?.name || '未知类型';
  };

  const displaySchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-6 h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 左侧: Bell Schedule (List) */}
      <div className="lg:col-span-5 glass-panel rounded-2xl p-6 shadow-lg flex flex-col overflow-hidden h-full border-t-4 border-blue-500">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-4 border-gray-200">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
             <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
           </svg>
           作息时间表
        </h3>
        <div className="flex-1 overflow-y-auto pr-2">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
              <tr className="text-gray-500 text-sm border-b border-gray-200">
                <th className="pb-3 pl-2 font-medium">时间</th>
                <th className="pb-3 font-medium">名称</th>
                <th className="pb-3 text-right pr-2 font-medium">类型</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {displaySchedule.length === 0 && (
                 <tr><td colSpan={3} className="text-center py-10 text-gray-400">暂无计划</td></tr>
               )}
               {displaySchedule.map((bell) => {
                 const isCurrent = currentBell?.id === bell.id;
                 const isNext = nextBell?.id === bell.id;
                 return (
                   <tr key={bell.id} className={`
                     transition-colors hover:bg-blue-50/50
                     ${isCurrent ? 'bg-blue-100/60' : ''} 
                     ${isNext ? 'bg-green-100/60' : ''}
                   `}>
                     <td className="py-3 pl-2 font-mono font-bold text-gray-700 text-lg">{bell.time}</td>
                     <td className="py-3 font-medium text-gray-800">
                       <div className="flex flex-col">
                         <span>{bell.name}</span>
                         <div className="flex gap-1 mt-1">
                            {isCurrent && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold shadow-sm">当前</span>}
                            {isNext && <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold shadow-sm">下个</span>}
                         </div>
                       </div>
                     </td>
                     <td className="py-3 text-right text-sm text-gray-500 pr-2">
                       <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">{getRingtoneName(bell.typeId)}</span>
                     </td>
                   </tr>
                 )
               })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 右侧: 从上往下展示 (时钟 -> 当前段 -> 下个段) */}
      <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-y-auto pb-2">
        
        {/* 1. 时钟卡片 */}
        <div className="glass-panel rounded-2xl p-8 shadow-lg text-center border-t-4 border-indigo-500 bg-gradient-to-br from-white to-indigo-50/50 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-48 h-48">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
           <h2 className="text-2xl lg:text-3xl text-gray-500 font-light mb-2 tracking-wide">{formatDate(now)}</h2>
           <div className="relative z-10">
             <h1 className="text-7xl lg:text-9xl font-bold text-slate-800 tracking-tighter tabular-nums leading-none mt-2 drop-shadow-sm">
               {formatTime(now)}
             </h1>
           </div>
        </div>

        {/* 2. 当前闹铃段 */}
        <div className={`glass-panel rounded-2xl p-6 shadow-md border-l-8 transition-all duration-500 relative overflow-hidden
            ${currentBell ? 'border-blue-500 bg-white' : 'border-gray-300 bg-gray-50/50'}`}>
            
             {/* Background Icon */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-32 h-32 text-blue-900">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
             </div>

             <div className="flex items-center justify-between mb-4 relative z-10">
               <h3 className="text-xl font-bold text-gray-600 flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full shadow-sm ${currentBell ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></span>
                  当前时段
               </h3>
               {currentBell && <span className="text-lg font-mono text-blue-700 bg-blue-100 px-4 py-1 rounded-full font-bold shadow-sm">{currentBell.time}</span>}
             </div>

             {currentBell ? (
               <div className="pl-7 relative z-10">
                 <div className="text-5xl font-bold text-slate-800">{currentBell.name}</div>
                 <div className="mt-3 text-gray-500 text-lg flex items-center gap-2 font-medium">
                   <span className="bg-gray-100 px-2 py-1 rounded text-sm border border-gray-200">
                     类型: {getRingtoneName(currentBell.typeId)}
                   </span>
                 </div>
               </div>
             ) : (
               <div className="text-gray-400 italic py-6 flex items-center justify-center relative z-10">
                 当前无活动闹铃时段（等待今日首个闹铃）
               </div>
             )}
        </div>

        {/* 3. 下个闹铃段 */}
        <div className={`glass-panel rounded-2xl p-6 shadow-md border-l-8 transition-all duration-500 relative overflow-hidden
            ${nextBell ? 'border-green-500 bg-white' : 'border-gray-300 bg-gray-50/50'}`}>
             
             {/* Background Icon */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-32 h-32 text-green-900">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
             </div>

             <div className="flex items-center justify-between mb-4 relative z-10">
               <h3 className="text-xl font-bold text-gray-600 flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></span>
                  下个时段
               </h3>
                {nextBell && <span className="text-lg font-mono text-green-700 bg-green-100 px-4 py-1 rounded-full font-bold shadow-sm">{nextBell.time}</span>}
             </div>

              {nextBell ? (
               <div className="pl-7 relative z-10">
                 <div className="text-4xl font-bold text-slate-800 opacity-90">{nextBell.name}</div>
                 <div className="mt-3 text-gray-500 text-lg flex items-center gap-2 font-medium">
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm border border-gray-200">
                     类型: {getRingtoneName(nextBell.typeId)}
                   </span>
                 </div>
               </div>
             ) : (
               <div className="text-gray-400 italic py-6 flex items-center justify-center relative z-10">
                 今日计划已全部完成
               </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;