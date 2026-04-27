import React from 'react';
import { X } from 'lucide-react';

const BeetleFormModal = ({ 
  isOpen, onClose, formData, setFormData, isEditing, onSave, 
  existingNames, existingSpecies, existingScientificNames, existingLocalities, existingGenerations 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl animate-slide-up max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-black text-emerald-800">{isEditing ? '個体情報を編集' : '新規個体を登録'}</h2>
          <button onClick={onClose} className="text-gray-400"><X size={24} /></button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] text-gray-400 uppercase ml-1">管理名 / 識別ID</label>
              <input list="name-options" className="w-full border p-3 rounded-xl text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例: 24HE-01" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase ml-1">種類 (和名)</label>
              <input list="species-options" className="w-full border p-3 rounded-xl text-sm" value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} placeholder="ヘラクレス" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase ml-1">学名</label>
              <input list="scientific-name-options" className="w-full border p-3 rounded-xl text-sm italic" value={formData.scientificName} onChange={e => setFormData({...formData, scientificName: e.target.value})} placeholder="Dynastes hercules" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase ml-1">産地</label>
              <input list="locality-options" className="w-full border p-3 rounded-xl text-sm" value={formData.locality} onChange={e => setFormData({...formData, locality: e.target.value})} placeholder="グアドループ" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase ml-1">累代</label>
              <input list="generation-options" className="w-full border p-3 rounded-xl text-sm" value={formData.generation} onChange={e => setFormData({...formData, generation: e.target.value})} placeholder="CBF1" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase ml-1">状態</label>
              <select className="w-full border p-3 rounded-xl text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Larva">幼虫</option>
                <option value="Adult">成虫</option>
                <option value="SpawnSet">産卵セット</option>
                <option value="Pupa">蛹</option>
              </select>
            </div>
            {!isEditing && (
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-gray-400 uppercase ml-1">登録頭数 (連番で作成)</label>
                <input type="number" min="1" max="50" className="w-full border p-3 rounded-xl text-sm" value={formData.count || 1} onChange={e => setFormData({...formData, count: parseInt(e.target.value) || 1})} />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-50 shrink-0">
          <button onClick={onSave} className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all">
            {isEditing ? '変更を保存' : '個体を登録'}
          </button>
        </div>
      </div>

      <datalist id="name-options">{existingNames.map(n => <option key={n} value={n} />)}</datalist>
      <datalist id="species-options">{existingSpecies.map(s => <option key={s} value={s} />)}</datalist>
      <datalist id="scientific-name-options">{existingScientificNames.map(s => <option key={s} value={s} />)}</datalist>
      <datalist id="locality-options">{existingLocalities.map(l => <option key={l} value={l} />)}</datalist>
      <datalist id="generation-options">
        {['CB', 'WD', 'CBF1', 'CBF2', 'WF1', 'WF2'].map(g => <option key={g} value={g} />)}
        {existingGenerations.map(g => <option key={g} value={g} />)}
      </datalist>
    </div>
  );
};

export default BeetleFormModal;