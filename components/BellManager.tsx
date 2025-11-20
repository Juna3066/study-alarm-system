import React, { useState } from 'react';
import { BellSchedule, RingtoneType } from '../types';

interface BellManagerProps {
  schedule: BellSchedule[];
  setSchedule: React.Dispatch<React.SetStateAction<BellSchedule[]>>;
  ringtones: RingtoneType[];
}

const BellManager: React.FC<BellManagerProps> = ({ schedule, setSchedule, ringtones }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [time, setTime] = useState('08:00');
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');

  const resetForm = () => {
    setTime('08:00');
    setName('');
    setTypeId(ringtones.length > 0 ? ringtones[0].id : '');
    setEditId(null);
    setIsEditing(false);
  };

  const handleEdit = (item: BellSchedule) => {
    setEditId(item.id);
    setTime(item.time);
    setName(item.name);
    setTypeId(item.typeId);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该闹铃吗？')) {
      setSchedule(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeId && ringtones.length > 0) {
        setTypeId(ringtones[0].id);
    }
    
    const validTypeId = typeId || (ringtones.length > 0 ? ringtones[0].id : '');
    if (!validTypeId) {
        alert("请先创建铃声类型。");
        return;
    }

    if (isEditing && editId) {
      setSchedule(prev => prev.map(item => 
        item.id === editId ? { ...item, time, name, typeId: validTypeId } : item
      ));
    } else {
      const newItem: BellSchedule = {
        id: crypto.randomUUID(),
        time,
        name,
        typeId: validTypeId,
      };
      setSchedule(prev => [...prev, newItem]);
    }
    resetForm();
  };

  // Sort schedule for display
  const sortedSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
            闹铃计划管理
        </h2>
        <button 
          onClick={() => { resetForm(); setIsEditing(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          添加闹铃
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
         <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-bold tracking-wider">
                <th className="p-4 w-32">触发时间</th>
                <th className="p-4">闹铃名称</th>
                <th className="p-4">铃声类型</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSchedule.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">暂无闹铃计划。</td>
                </tr>
              )}
              {sortedSchedule.map(bell => {
                const rType = ringtones.find(r => r.id === bell.typeId);
                return (
                  <tr key={bell.id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700 text-lg">{bell.time}</td>
                    <td className="p-4 font-bold text-slate-800">{bell.name}</td>
                    <td className="p-4 text-slate-600">
                        <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-md text-xs font-bold border border-blue-100">
                             {rType?.name || '类型已失效'}
                        </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => handleEdit(bell)} className="text-blue-600 hover:text-blue-800 font-medium text-sm underline-offset-2 hover:underline">编辑</button>
                      <button onClick={() => handleDelete(bell.id)} className="text-red-500 hover:text-red-700 font-medium text-sm underline-offset-2 hover:underline">删除</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out] transform transition-all">
            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">
                {editId ? '编辑闹铃' : '添加新闹铃'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">触发时间</label>
                <input 
                  type="time" 
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xl font-mono tracking-wide"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">闹铃名称</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="例如：第一节课，眼保健操"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">选择铃声类型</label>
                <select 
                  value={typeId}
                  onChange={e => setTypeId(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  required
                >
                    {ringtones.length === 0 && <option value="">请先到“铃声类型管理”添加类型</option>}
                    {ringtones.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
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
                  保存设置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BellManager;