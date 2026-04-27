import React from 'react';
import { X, Copy, Edit3, Bug, Ghost, Trash2, Scale, Activity, Thermometer, MessageSquare, Crown, RefreshCw, ArrowUpDown } from 'lucide-react';
import { CATEGORIES } from './beetleUtils.js';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

// ヘルパーコンポーネント (CommonUI.jsx がない場合の暫定定義)
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-1 border-b border-slate-50">
    <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
    <span className="text-xs font-black text-slate-700">{value || '-'}</span>
  </div>
);

const LineageSection = ({ beetle, beetles }) => {
  const father = beetles.find(b => b.id === beetle.parentMaleId);
  const mother = beetles.find(b => b.id === beetle.parentFemaleId);
  return (
    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Lineage (血統情報)</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white p-2 rounded-lg border border-slate-100">
          <p className="text-[8px] text-blue-500 font-bold">♂ Father</p>
          <p className="text-[10px] font-black truncate">{father ? father.name : (beetle.parentMaleId || '不明')}</p>
        </div>
        <div className="bg-white p-2 rounded-lg border border-slate-100">
          <p className="text-[8px] text-pink-500 font-bold">♀ Mother</p>
          <p className="text-[10px] font-black truncate">{mother ? mother.name : (beetle.parentFemaleId || '不明')}</p>
        </div>
      </div>
    </div>
  );
};

export const BeetleDetailModal = ({ 
  beetle, onClose, beetles, config, onCopy, onEdit, onEmergence, onDeath, onRevert, onDelete, 
  newWeight, setNewWeight, newTemp, setNewTemp, newLog, setNewLog, fetchSbTemp, isFetchingSb, onAddRecord, 
  editingRecord, setEditingRecord, onUpdateRecord, onDeleteRecord
}) => {
  if (!beetle) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 flex flex-col" onClick={onClose}>
      <div className="bg-white mt-12 flex-1 rounded-t-3xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-emerald-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{(CATEGORIES[beetle.status + 's'] || '個体')}詳細</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="p-5 rounded-2xl mb-4 border bg-white border-slate-100 shadow-sm relative">
            <h3 className="text-2xl font-black text-slate-800">{beetle.name}</h3>
            <div className="space-y-1 mt-4">
              <InfoRow label="産地" value={beetle.locality} />
              <InfoRow label="累代" value={beetle.generation} />
              <InfoRow label="状態" value={config.labels[beetle.status] || '未設定'} />
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => onCopy(beetle)} className="text-emerald-600 p-1"><Copy size={20}/></button>
              <button onClick={() => onEdit(beetle)} className="text-blue-500 p-1"><Edit3 size={20}/></button>
              <button onClick={(e) => onDelete(beetle.id, e)} className="text-rose-600 p-1"><Trash2 size={20}/></button>
            </div>
          </div>
          <LineageSection beetle={beetle} beetles={beetles} />
          {/* 履歴などのコンテンツ */}
        </div>
      </div>
    </div>
  );
};

// 他のモーダルコンポーネントの定義
export const EmergenceModal = ({ isOpen, onClose, formData, setFormData, onSubmit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-emerald-800">羽化報告</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="space-y-4">
          <input type="date" className="w-full border p-3 rounded-xl" value={formData.emergenceDate} onChange={e => setFormData({...formData, emergenceDate: e.target.value})} />
          <button onClick={onSubmit} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black">羽化を記録</button>
        </div>
      </div>
    </div>
  );
};

export const DeathModal = ({ isOpen, onClose, formData, setFormData, onSubmit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-rose-800">死亡・★報告</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="space-y-4">
          <input type="date" className="w-full border p-3 rounded-xl" value={formData.deathDate} onChange={e => setFormData({...formData, deathDate: e.target.value})} />
          <button onClick={onSubmit} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black">記録してアーカイブ</button>
        </div>
      </div>
    </div>
  );
};

export const StatGraphModal = ({ info, onClose, viewMode, setViewMode, sortConfig, setSortConfig, beetles, onSelectBeetle }) => {
  if (!info) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-800">{info.title}</h3>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="h-64 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={info.data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis unit={info.unit} />
                <Tooltip />
                <Bar dataKey="value" fill={info.color} radius={[4, 4, 0, 0]}>
                  {info.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} onClick={() => onSelectBeetle(entry.name)} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {info.data.map((item, i) => (
              <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-xl text-xs font-bold" onClick={() => onSelectBeetle(item.name)}>
                <span>{item.name}</span>
                <span className="text-emerald-600">{item.value}{info.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const BatchRecordModal = ({ isOpen, onClose, selectedIds, targets, onToggle, onSelectAll, onClearAll, newLog, setNewLog, newTemp, setNewTemp, onFetchTemp, onSubmit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-black text-emerald-800">一括交換記録</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50 p-3 rounded-xl">
               <p className="text-[10px] text-slate-400 font-black mb-1">交換日</p>
               <input type="date" className="w-full bg-transparent font-bold outline-none" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} />
             </div>
             <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
               <div className="flex-1">
                 <p className="text-[10px] text-slate-400 font-black mb-1">温度 (℃)</p>
                 <input type="number" step="0.1" className="w-full bg-transparent font-bold outline-none" value={newTemp} onChange={e => setNewTemp(e.target.value)} />
               </div>
               <button onClick={() => onFetchTemp()} className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><RefreshCw size={16} /></button>
             </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 font-black">対象個体 ({selectedIds.size} / {targets.length})</p>
            <div className="grid grid-cols-1 gap-2">
              {targets.map(t => (
                <div key={t.id} onClick={() => onToggle(t.id)} className={`p-3 rounded-xl border flex justify-between items-center transition-all ${selectedIds.has(t.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                  <span className="text-sm font-bold">{t.name}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.has(t.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                    {selectedIds.has(t.id) && <X size={12} className="rotate-45" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onSubmit} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg">選択した個体に記録を反映</button>
        </div>
      </div>
    </div>
  );
};