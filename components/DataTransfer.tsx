import React from 'react';
import { AppData, BellSchedule, RingtoneType } from '../types';
import { clearAudioFiles } from '../services/db';

interface DataTransferProps {
  ringtones: RingtoneType[];
  schedule: BellSchedule[];
  onImport: (data: AppData) => void;
}

const DataTransfer: React.FC<DataTransferProps> = ({ ringtones, schedule, onImport }) => {
  
  const handleExport = () => {
    const data: AppData = {
      ringtones: ringtones.map(r => ({ ...r, fileBlob: undefined })), // Do not export large blobs to JSON
      schedule
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school_bell_config_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json) as AppData;
        
        if (confirm("导入操作将覆盖当前所有的闹铃计划和类型设置。\n\n注意：由于浏览器安全限制，音频文件无法包含在导出文件中，导入后您需要重新上传每个类型的音频文件。\n\n是否继续？")) {
            await clearAudioFiles();
            onImport(data);
            alert("配置已成功导入。\n请前往【铃声类型管理】为导入的类型重新上传MP3文件。");
        }
      } catch (err) {
        alert("无效的配置文件，请检查文件格式。");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={handleExport}
        className="text-gray-600 hover:text-blue-600 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium w-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        导出配置
      </button>
      
      <label className="text-gray-600 hover:text-blue-600 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer text-sm font-medium w-full">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" transform="rotate(180 12 12)"/>
        </svg>
        导入配置
        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
      </label>
    </div>
  );
};

export default DataTransfer;