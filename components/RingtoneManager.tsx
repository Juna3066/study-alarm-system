import React, { useState, useRef } from 'react';
import { RingtoneType } from '../types';
import { saveAudioFile, deleteAudioFile } from '../services/db';

interface RingtoneManagerProps {
  ringtones: RingtoneType[];
  setRingtones: React.Dispatch<React.SetStateAction<RingtoneType[]>>;
}

const RingtoneManager: React.FC<RingtoneManagerProps> = ({ ringtones, setRingtones }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setRemarks('');
    setFile(null);
    setEditId(null);
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (item: RingtoneType) => {
    setEditId(item.id);
    setName(item.name);
    setRemarks(item.remarks);
    setFile(null); // Can't prepopulate file input
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该铃声类型吗？此操作不可恢复。')) {
      await deleteAudioFile(id);
      setRingtones(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && editId) {
      // Update
      const updated: RingtoneType = {
        id: editId,
        name,
        remarks,
        fileName: file ? file.name : ringtones.find(r => r.id === editId)?.fileName || '',
      };
      
      if (file) {
        await saveAudioFile(editId, file);
      }

      setRingtones(prev => prev.map(r => r.id === editId ? updated : r));
    } else {
      // Create
      if (!file) {
        alert("请选择一个音频文件 (MP3)。");
        return;
      }
      const newId = crypto.randomUUID();
      const newRingtone: RingtoneType = {
        id: newId,
        name,
        fileName: file.name,
        remarks,
      };
      
      await saveAudioFile(newId, file);
      setRingtones(prev => [...prev, newRingtone]);
    }
    resetForm();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
           <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
           铃声类型管理
        </h2>
        <button 
          onClick={() => { resetForm(); setIsEditing(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          新增类型
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-bold tracking-wider">
                <th className="p-4">类型名称</th>
                <th className="p-4">铃声文件</th>
                <th className="p-4">备注</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ringtones.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">暂无铃声类型，请点击右上角添加。</td>
                </tr>
              )}
              {ringtones.map(rt => (
                <tr key={rt.id} className="hover:bg-blue-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{rt.name}</td>
                  <td className="p-4 text-slate-600">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">{rt.fileName}</span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">{rt.remarks || '-'}</td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => handleEdit(rt)} className="text-blue-600 hover:text-blue-800 font-medium text-sm underline-offset-2 hover:underline">编辑</button>
                    <button onClick={() => handleDelete(rt.id)} className="text-red-500 hover:text-red-700 font-medium text-sm underline-offset-2 hover:underline">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out] transform transition-all">
            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">
                {editId ? '编辑铃声类型' : '新增铃声类型'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">类型名称</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  placeholder="例如：上课铃，下课铃"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">铃声文件 (MP3)</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="audio/mp3,audio/*"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  required={!editId} 
                />
                {editId && !file && <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">当前文件: <span className="font-mono">{ringtones.find(r => r.id === editId)?.fileName}</span></p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">备注</label>
                <textarea 
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  rows={3}
                  placeholder="可选：关于此铃声的说明"
                />
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RingtoneManager;