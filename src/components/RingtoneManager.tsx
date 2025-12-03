import React, { useState, useRef, useEffect } from 'react';
import { RingtoneType } from '../types';
import { saveAudioFile, deleteAudioFile, getAudioFile } from '../services/db';

interface RingtoneManagerProps {
  ringtones: RingtoneType[];
  setRingtones: React.Dispatch<React.SetStateAction<RingtoneType[]>>;
}

const RingtoneManager: React.FC<RingtoneManagerProps> = ({ ringtones, setRingtones }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const activeUrlRef = useRef<string | null>(null);

  const [name, setName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (activeUrlRef.current) URL.revokeObjectURL(activeUrlRef.current);
      audioRef.current.pause();
    };
  }, []);

  const resetForm = () => {
    setName('');
    setRemarks('');
    setFile(null);
    setEditId(null);
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (item: RingtoneType) => {
    stopPreview();
    setEditId(item.id);
    setName(item.name);
    setRemarks(item.remarks);
    setFile(null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该铃声类型吗？此操作不可恢复。')) {
      if (previewId === id) stopPreview();
      await deleteAudioFile(id);
      setRingtones(prev => prev.filter(r => r.id !== id));
    }
  };

  const stopPreview = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPreviewId(null);
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  };

  const handlePreview = async (id: string) => {
    if (previewId === id) {
      stopPreview();
      return;
    }
    stopPreview();
    try {
      const blob = await getAudioFile(id);
      if (!blob) {
        alert('找不到音频文件，请重新上传。');
        return;
      }
      const url = URL.createObjectURL(blob);
      activeUrlRef.current = url;
      audioRef.current.src = url;
      audioRef.current.onended = () => stopPreview();
      await audioRef.current.play();
      setPreviewId(id);
    } catch (err) {
      console.error("Preview failed", err);
      alert("播放失败，可能是浏览器限制或文件损坏。");
      stopPreview();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && editId) {
      const updated: RingtoneType = {
        id: editId,
        name,
        remarks,
        fileName: file ? file.name : ringtones.find(r => r.id === editId)?.fileName || '',
      };
      if (file) await saveAudioFile(editId, file);
      setRingtones(prev => prev.map(r => r.id === editId ? updated : r));
    } else {
      if (!file) { alert("请选择一个音频文件 (MP3)。"); return; }
      const newId = crypto.randomUUID();
      const newRingtone: RingtoneType = { id: newId, name, fileName: file.name, remarks };
      await saveAudioFile(newId, file);
      setRingtones(prev => [...prev, newRingtone]);
    }
    resetForm();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      {/* 修复布局：使用 flex-wrap 代替 flex-col
         1. flex-wrap: 允许内容自动换行，而不是强制垂直排列。
         2. items-center: 保持垂直居中对齐。
         3. justify-between: 标题在左，按钮在右。
      */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 whitespace-nowrap">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600 dark:text-blue-400">
             <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
           </svg>
           铃声类型管理
        </h2>
        {/* 修复按钮：移除 w-full
           1. 移除了 w-full sm:w-auto，现在它是自然宽度。
           2. 添加 shrink-0 防止被标题挤压。
        */}
        <button onClick={() => { resetForm(); setIsEditing(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium whitespace-nowrap shrink-0">
          新增类型
        </button>
      </div>

      <div className="bg-white dark:bg-[#1e293b]/50 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-bold tracking-wider">
                <th className="p-4 whitespace-nowrap">类型名称</th>
                <th className="p-4 whitespace-nowrap">铃声文件</th>
                <th className="p-4 whitespace-nowrap">备注</th>
                <th className="p-4 text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {ringtones.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400 dark:text-gray-500">暂无铃声类型，请点击右上角添加。</td></tr>
              )}
              {ringtones.map(rt => (
                <tr key={rt.id} className="hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">{rt.name}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                        {rt.fileName}
                      </span>
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-sm min-w-[150px]">{rt.remarks || '-'}</td>
                  <td className="p-4 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => handlePreview(rt.id)} className={`font-medium text-sm inline-flex items-center gap-1 ${previewId === rt.id ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                      {previewId === rt.id ? '停止' : '试听'}
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button onClick={() => handleEdit(rt)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm">编辑</button>
                    <button onClick={() => handleDelete(rt.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out] border border-white/20 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">
                {editId ? '编辑铃声类型' : '新增铃声类型'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">类型名称</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-slate-600 border px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">铃声文件 (MP3)</label>
                <input type="file" ref={fileInputRef} accept="audio/mp3,audio/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 dark:file:bg-blue-900/40 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/60 cursor-pointer" required={!editId} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">备注</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-slate-600 border px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium">取消</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RingtoneManager;