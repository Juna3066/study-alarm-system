
import React, { useState, useRef } from 'react';
import { BellSchedule, RingtoneType } from '../types';
import * as XLSX from 'xlsx';

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
  const [remarks, setRemarks] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTime('08:00');
    setName('');
    setTypeId(ringtones.length > 0 ? ringtones[0].id : '');
    setRemarks('');
    setEditId(null);
    setIsEditing(false);
  };

  const handleEdit = (item: BellSchedule) => {
    setEditId(item.id);
    setTime(item.time);
    setName(item.name);
    setTypeId(item.typeId);
    setRemarks(item.remarks || '');
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
        item.id === editId ? { ...item, time, name, typeId: validTypeId, remarks } : item
      ));
    } else {
      const newItem: BellSchedule = {
        id: crypto.randomUUID(),
        time,
        name,
        typeId: validTypeId,
        remarks,
      };
      setSchedule(prev => [...prev, newItem]);
    }
    resetForm();
  };

  // --- Excel Export Logic ---
  const handleExportExcel = () => {
    if (schedule.length === 0) {
      alert("没有可导出的数据。");
      return;
    }

    // Map data to user-friendly format
    const data = schedule.map(s => ({
      '触发时间': s.time,
      '闹铃名称': s.name,
      '铃声类型': ringtones.find(r => r.id === s.typeId)?.name || '未知',
      '备注': s.remarks || ''
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Adjust column width (optional)
    const wscols = [
      {wch: 10}, // Time
      {wch: 20}, // Name
      {wch: 15}, // Type
      {wch: 30}  // Remarks
    ];
    ws['!cols'] = wscols;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "闹铃计划");

    // Write file
    XLSX.writeFile(wb, `闹铃计划_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Excel Import Logic ---
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // Read as raw values to handle times correctly manually if needed, or let XLSX handle it
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("Excel 文件为空或格式不正确。");
          return;
        }

        if (!confirm(`检测到 ${data.length} 条闹铃数据。\n导入将【覆盖】当前列表，是否继续？`)) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const newSchedule: BellSchedule[] = [];
        let defaultTypeId = ringtones.length > 0 ? ringtones[0].id : '';

        data.forEach((row, index) => {
          // Flexible column mapping
          const rowTime = row['触发时间'] || row['时间'] || row['Time'];
          const rowName = row['闹铃名称'] || row['名称'] || row['Name'];
          const rowType = row['铃声类型'] || row['类型'] || row['Type'];
          const rowRemarks = row['备注'] || row['Remarks'];

          if (!rowTime || !rowName) return; // Skip invalid rows

          // Normalize Time
          let formattedTime = '00:00';
          if (typeof rowTime === 'number') {
             // Excel stores time as fraction of day (e.g., 0.5 = 12:00)
             const totalMinutes = Math.round(rowTime * 24 * 60);
             const h = Math.floor(totalMinutes / 60);
             const m = totalMinutes % 60;
             formattedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          } else {
             // Assume string "HH:mm" or "HH:mm:ss"
             const str = String(rowTime).trim();
             const parts = str.split(':');
             if (parts.length >= 2) {
               formattedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
             }
          }

          // Match Ringtone Type by Name
          let matchedTypeId = defaultTypeId;
          if (rowType) {
            const found = ringtones.find(r => r.name === rowType);
            if (found) matchedTypeId = found.id;
          }

          newSchedule.push({
            id: crypto.randomUUID(),
            time: formattedTime,
            name: rowName,
            typeId: matchedTypeId,
            remarks: rowRemarks || ''
          });
        });

        setSchedule(newSchedule);
        alert(`成功导入 ${newSchedule.length} 条计划。`);

      } catch (err) {
        console.error(err);
        alert("解析 Excel 文件失败，请确保文件格式正确。");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
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
        
        <div className="flex gap-2">
            {/* Hidden File Input */}
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImportExcel} 
            />

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium text-sm"
              title="从 Excel 导入"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" transform="rotate(180 12 12)"/>
               </svg>
               导入Excel
            </button>

            <button 
              onClick={handleExportExcel}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium text-sm"
              title="导出为 Excel"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
               </svg>
               导出Excel
            </button>

            <button 
              onClick={() => { resetForm(); setIsEditing(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-medium ml-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              添加闹铃
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
         <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-bold tracking-wider">
                <th className="p-4 w-32">触发时间</th>
                <th className="p-4">闹铃名称</th>
                <th className="p-4">铃声类型</th>
                <th className="p-4">备注</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSchedule.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">暂无闹铃计划。</td>
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
                    <td className="p-4 text-slate-500 text-sm max-w-[200px] truncate" title={bell.remarks}>
                        {bell.remarks || '-'}
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">备注</label>
                <textarea 
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  rows={2}
                  placeholder="可选：备注信息"
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
