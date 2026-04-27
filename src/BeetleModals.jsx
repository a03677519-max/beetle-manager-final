import React from 'react';
import { X, Copy, Edit3, Bug, Ghost, Trash2, Scale, Activity } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { InfoRow, LineageSection } from './CommonUI';

export const BeetleDetailModal = ({ 
  beetle, onClose, beetles, config, onCopy, onEdit, onEmergence, onDeath, onDelete, 
  newWeight, setNewWeight, newTemp, setNewTemp, fetchSbTemp, isFetchingSb, onAddRecord, onDeleteRecord
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

// 他のモーダル (EmergenceModal, DeathModal等) も同様に export する