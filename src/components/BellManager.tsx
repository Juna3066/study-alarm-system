import React, { useState, useRef } from 'react';
import { BellSchedule, RingtoneType } from '../types';
import * as XLSX from 'xlsx';

interface BellManagerProps {
  schedule: BellSchedule[];
  setSchedule: React.Dispatch<React.SetStateAction<BellSchedule[]>>;
  ringtones: RingtoneType[];
  onScheduleUpdate: () => void; // <--- 新增回调函数 prop
}

const BellManager: React.FC<BellManagerProps> = ({ schedule, setSchedule, ringtones, onScheduleUpdate }) => {
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

  // 替换 handleDelete 函数
  const handleDelete = (id: string) => {
    if (confirm('确定要删除该闹铃吗？')) {
      setSchedule(prev => prev.filter(s => s.id !== id));
      // 调用父组件的回调函数，触发即时推送
      onScheduleUpdate();
    }
  };

  // 替换 handleSubmit 函数
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
    // 立即通知父组件数据已更新
    onScheduleUpdate();
    resetForm();
  };

  const handleExportExcel = () => {
    if (schedule.length === 0) {
      alert("没有可导出的数据。");
      return;
    }
    const data = schedule.map(s => ({
      '触发时间': s.time,
      '闹铃名称': s.name,
      '铃声类型': ringtones.find(r => r.id === s.typeId)?.name || '未知',
      '备注': s.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wscols = [{wch: 10}, {wch: 20}, {wch: 15}, {wch: 30}];
    ws['!cols'] = wscols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "闹铃计划");
    XLSX.writeFile(wb, `闹铃计划_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

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
          const rowTime = row['触发时间'] || row['时间'] || row['Time'];
          const rowName = row['闹铃名称'] || row['名称'] || row['Name'];
          const rowType = row['铃声类型'] || row['类型'] || row['Type'];
          const rowRemarks = row['备注'] || row['Remarks'];

          if (!rowTime || !rowName) return;

          let formattedTime = '00:00';
          if (typeof rowTime === 'number') {
            const totalMinutes = Math.round(rowTime * 24 * 60);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            formattedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          } else {
            const str = String(rowTime).trim();
            const parts = str.split(':');
            if (parts.length >= 2) {
              formattedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            }
          }

          let matchedTypeId = defaultTypeId;
          if (rowType) {
            const found = ringtones.find(r => r.name.includes(rowType) || rowType.includes(r.name));
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

        // --- 导入成功逻辑 ---
        setSchedule(newSchedule);
        alert(`成功导入 ${newSchedule.length} 条计划。`);
        // 💡 导入成功后立即通知父组件
        onScheduleUpdate(); // <-- 触发 Dashboard 更新

      } catch (err) {
        console.error(err);
        alert("解析 Excel 文件失败，请确保文件格式正确。");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{ '触发时间': '08:00', '闹铃名称': '示例课程', '铃声类型': '上课铃', '备注': '示例备注' }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "模板");
    XLSX.writeFile(wb, "闹铃计划表_模板.xlsx");
  };

  const sortedSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      {/* 修复头部布局：flex-col lg:flex-row
         1. 移动端：垂直排列，标题在上，按钮组在下。
         2. 桌面端：水平对齐。
      */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600 dark:text-blue-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          闹铃计划管理
        </h2>

        {/* 修复按钮组：overflow-x-auto
           1. 移除 flex-wrap，改为 flex（单行）。
           2. 添加 overflow-x-auto，允许在屏幕不够宽时横向滚动按钮，
              彻底解决按钮被挤成 2x2 或 3x1 的杂乱排版。
        */}
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="hidden" onChange={handleImportExcel} />
          <button onClick={handleDownloadTemplate} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-400 px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium text-sm whitespace-nowrap shrink-0">
            下载模板
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium text-sm whitespace-nowrap shrink-0">
            导入Excel
          </button>
          <button onClick={handleExportExcel} className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium text-sm whitespace-nowrap shrink-0">
            导出Excel
          </button>
          <button onClick={() => { resetForm(); setIsEditing(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-medium whitespace-nowrap shrink-0">
            添加闹铃
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b]/50 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-bold tracking-wider">
                <th className="p-4 w-32 whitespace-nowrap">触发时间</th>
                <th className="p-4 whitespace-nowrap">闹铃名称</th>
                <th className="p-4 whitespace-nowrap">铃声类型</th>
                <th className="p-4 whitespace-nowrap">备注</th>
                <th className="p-4 text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {sortedSchedule.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500">暂无闹铃计划。</td></tr>
              )}
              {sortedSchedule.map(bell => {
                const rType = ringtones.find(r => r.id === bell.typeId);
                return (
                  <tr key={bell.id} className="hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-200 text-lg whitespace-nowrap">{bell.time}</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">{bell.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-1 px-3 rounded-md text-xs font-bold border border-blue-100 dark:border-blue-800 whitespace-nowrap">
                        {rType?.name || '类型已失效'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm max-w-[200px] truncate" title={bell.remarks}>{bell.remarks || '-'}</td>
                    <td className="p-4 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => handleEdit(bell)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm">编辑</button>
                      <button onClick={() => handleDelete(bell.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm">删除</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out] border border-white/20 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">
              {editId ? '编辑闹铃' : '添加新闹铃'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">触发时间</label>
                <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-slate-600 border px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">闹铃名称</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-slate-600 border px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如：第一节课" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">选择铃声类型</label>
                <select value={typeId} onChange={e => setTypeId(e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-slate-600 border px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required>
                  {ringtones.length === 0 && <option value="">请先添加类型</option>}
                  {ringtones.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">备注</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-slate-600 border px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium">取消</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md">保存设置</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BellManager;