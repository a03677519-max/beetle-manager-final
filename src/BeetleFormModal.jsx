import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, Upload } from 'lucide-react';

/**
 * ロール式セレクターコンポーネント
 */
const WheelPicker = ({ options, value, onChange, className = "" }) => {
  const wheelRef = useRef(null);
  const itemHeight = 40; // px

  const handleScroll = useCallback(() => {
    if (!wheelRef.current) return;
    const scrollTop = wheelRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (options[index] !== undefined && options[index] !== value) {
      if (window.navigator.vibrate) window.navigator.vibrate(10);
      onChange(options[index]);
    }
  }, [options, value, onChange]);

  useEffect(() => {
    if (wheelRef.current) {
      const index = options.indexOf(value);
      if (index !== -1) {
        wheelRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []); // 初期マウント時のみ

  return (
    <div className={`relative h-[120px] overflow-hidden picker-viewport ${className}`}>
      <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-white/5 border-y border-white/10 pointer-events-none" />
      <div 
        ref={wheelRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto picker-wheel py-[40px]"
      >
        {options.map((opt, i) => (
          <div key={i} className={`h-10 flex items-center justify-center text-sm font-black transition-colors picker-item ${opt === value ? 'text-white' : 'text-white/20'}`}>
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};

const BeetleFormModal = ({ 
  isOpen, onClose, formData, setFormData, isEditing, onSave, onImport,
  existingNames, existingSpecies, existingScientificNames, existingLocalities, existingGenerations 
}) => {
  if (!isOpen) return null;

  // 各入力項目へのフォーカス制御用Ref
  const nameRef = useRef(null);
  const speciesRef = useRef(null);
  const sciRef = useRef(null);
  const locRef = useRef(null);
  const genRef = useRef(null);
  const countRef = useRef(null);
  const saveRef = useRef(null);

  // ステータスに応じたアクセントカラーを定義
  const accentColors = {
    Larva: {
      main: 'emerald', // Fallback for general elements
      buttonFrom: 'from-amber-600',
      buttonTo: 'to-amber-500',
      shadow: 'shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)]',
      ring: 'focus:ring-amber-500',
      border: 'focus:border-amber-500',
      text: 'text-amber-400/60',
      chipActiveBg: 'bg-amber-500',
      chipActiveBorder: 'border-amber-400',
      chipActiveShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]'
    },
    Adult: {
      main: 'emerald',
      buttonFrom: 'from-emerald-600',
      buttonTo: 'to-emerald-500',
      shadow: 'shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)]',
      ring: 'focus:ring-emerald-500',
      border: 'focus:border-emerald-500',
      text: 'text-emerald-400/60',
      chipActiveBg: 'bg-emerald-500',
      chipActiveBorder: 'border-emerald-400',
      chipActiveShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
    },
    SpawnSet: {
      main: 'rose',
      buttonFrom: 'from-rose-600',
      buttonTo: 'to-rose-500',
      shadow: 'shadow-[0_20px_40px_-10px_rgba(244,63,94,0.3)]',
      ring: 'focus:ring-rose-500',
      border: 'focus:border-rose-500',
      text: 'text-rose-400/60',
      chipActiveBg: 'bg-rose-500',
      chipActiveBorder: 'border-rose-400',
      chipActiveShadow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]'
    },
    Pupa: {
      main: 'indigo',
      buttonFrom: 'from-indigo-600',
      buttonTo: 'to-indigo-500',
      shadow: 'shadow-[0_20px_40px_-10px_rgba(99,102,241,0.3)]',
      ring: 'focus:ring-indigo-500',
      border: 'focus:border-indigo-500',
      text: 'text-indigo-400/60',
      chipActiveBg: 'bg-indigo-500',
      chipActiveBorder: 'border-indigo-400',
      chipActiveShadow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]'
    }
  };

  const currentAccent = accentColors[formData.status] || accentColors.Adult; // デフォルトはAdult

  // 累代の3カラムパース
  const [gen1, setGen1] = useState('CB'); // WD, CB
  const [gen2, setGen2] = useState('CBF'); // -, WF, CBF
  const [gen3, setGen3] = useState('1'); // 1, 2, 3...

  // 日付のロールパース
  const parseDate = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return { y: d.getFullYear().toString(), m: (d.getMonth() + 1).toString().padStart(2, '0'), d: d.getDate().toString().padStart(2, '0') };
  };

  const [rollDate, setRollDate] = useState(parseDate(formData.hatchDate || formData.emergenceDate || formData.setDate));

  // 累代の統合
  useEffect(() => {
    let result = "";
    if (gen1 === 'WD' && gen2 === '-') result = "WD";
    else if (gen2 === '-') result = `${gen1}${gen3}`;
    else result = `${gen2}${gen3}`;
    
    if (formData.generation !== result) {
      setFormData(prev => ({ ...prev, generation: result }));
    }
  }, [gen1, gen2, gen3]);

  // 5段階評価のボタングループ
  const LevelSelector = ({ label, value, onChange }) => (
    <div className="space-y-1">
      <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>{label}</label>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(lv => (
          <button
            key={lv}
            type="button"
            onClick={() => onChange(lv)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${value === lv ? `${currentAccent.chipActiveBg} text-white` : 'bg-white/5 border-white/10 text-white/30'}`}
          >
            {lv}
          </button>
        ))}
      </div>
    </div>
  );

  // 次の項目へフォーカスを移す関数
  const focusNext = (ref) => {
    setTimeout(() => {
      ref?.current?.focus();
    }, 100);
  };

  // 保存時にキーボードを強制的に閉じるためのラップ関数
  const handleLocalSave = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end overscroll-none" onClick={onClose}>
      <div className="bg-white/10 backdrop-blur-2xl w-full rounded-t-[3rem] animate-slide-up max-h-[85dvh] flex flex-col overflow-hidden border-t border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-8 bg-white/5 backdrop-blur-md border-b border-white/10 shrink-0">
          <h2 className={`text-xl font-black text-white tracking-tight`}>{isEditing ? '個体情報を編集' : '新規個体を登録'}</h2>
          <div className="flex items-center gap-4">
            {!isEditing && (
              <button onClick={onImport} className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 active:scale-95 transition-all">
                <Upload size={14} /> クリップボードから引用
              </button>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1"><X size={28} /></button>
          </div>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto flex-1 text-white">
          <div className="space-y-2">
            <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>現在の状態を選択</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: 'Larva', label: '幼虫' },
                { id: 'Adult', label: '成虫' },
                { id: 'SpawnSet', label: '産卵' },
                { id: 'Pupa', label: '蛹' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({...formData, status: opt.id})}
                  className={`shrink-0 px-6 py-3.5 rounded-2xl font-black text-xs transition-all border ${
                    formData.status === opt.id 
                      ? `${currentAccent.chipActiveBg} ${currentAccent.chipActiveBorder} text-white ${currentAccent.chipActiveShadow} scale-105` 
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <div className="flex justify-between items-center ml-1">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest`}>管理名 / 識別ID</label>
                <button onClick={() => focusNext(speciesRef)} className="text-[8px] font-black text-white/30 hover:text-white flex items-center gap-0.5 transition-colors uppercase">Next <ChevronRight size={10} /></button>
              </div>
              <input ref={nameRef} list="name-options" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring} transition-all`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例: 24HE-01" />
            </div>
            <div className="space-y-1 col-span-1">
              <div className="flex justify-between items-center ml-1">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest`}>種類 (和名)</label>
                <button onClick={() => focusNext(sciRef)} className="text-[8px] font-black text-white/30 hover:text-white flex items-center gap-0.5 transition-colors uppercase">Next <ChevronRight size={10} /></button>
              </div>
              <input ref={speciesRef} list="species-options" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring} transition-all`} value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} placeholder="ヘラクレス" />
            </div>
            <div className="space-y-1 col-span-1">
              <div className="flex justify-between items-center ml-1">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest`}>学名</label>
                <button onClick={() => focusNext(locRef)} className="text-[8px] font-black text-white/30 hover:text-white flex items-center gap-0.5 transition-colors uppercase">Next <ChevronRight size={10} /></button>
              </div>
              <input ref={sciRef} list="scientific-name-options" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring} transition-all italic`} value={formData.scientificName} onChange={e => setFormData({...formData, scientificName: e.target.value})} placeholder="Dynastes hercules" />
            </div>
            <div className="space-y-1 col-span-1">
              <div className="flex justify-between items-center ml-1">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest`}>産地</label>
                <button onClick={() => focusNext(genRef)} className="text-[8px] font-black text-white/30 hover:text-white flex items-center gap-0.5 transition-colors uppercase">Next <ChevronRight size={10} /></button>
              </div>
              <input ref={locRef} list="locality-options" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring} transition-all`} value={formData.locality} onChange={e => setFormData({...formData, locality: e.target.value})} placeholder="グアドループ" />
            </div>
            
            {/* 累代ロールセレクター */}
            <div className="space-y-1 col-span-2">
              <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>累代構成</label>
              <div className="grid grid-cols-3 gap-1 bg-white/5 rounded-2xl p-1 border border-white/10">
                <WheelPicker options={['WD', 'CB']} value={gen1} onChange={setGen1} />
                <WheelPicker options={['-', 'WF', 'CBF']} value={gen2} onChange={setGen2} />
                <WheelPicker options={['-', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']} value={gen3} onChange={setGen3} />
              </div>
              <p className="text-[10px] text-white/40 text-center font-black mt-1">選択結果: <span className={currentAccent.text}>{formData.generation}</span></p>
            </div>

            {/* 状態別の追加項目 */}
            {(formData.status === 'Adult' || formData.status === 'SpawnSet') && (
              <>
                <div className="space-y-1 col-span-2">
                  <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>日付選択 (ロール)</label>
                  <div className="grid grid-cols-3 gap-1 bg-white/5 rounded-2xl p-1 border border-white/10">
                    <WheelPicker 
                      options={Array.from({length: 11}, (_, i) => (2020 + i).toString())} 
                      value={rollDate.y} 
                      onChange={(v) => {
                        const newDate = `${v}-${rollDate.m}-${rollDate.d}`;
                        setRollDate({...rollDate, y: v});
                        setFormData({...formData, emergenceDate: newDate, hatchDate: newDate, setDate: newDate});
                      }} 
                    />
                    <WheelPicker 
                      options={Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'))} 
                      value={rollDate.m} 
                      onChange={(v) => {
                        const newDate = `${rollDate.y}-${v}-${rollDate.d}`;
                        setRollDate({...rollDate, m: v});
                        setFormData({...formData, emergenceDate: newDate, hatchDate: newDate, setDate: newDate});
                      }} 
                    />
                    <WheelPicker 
                      options={Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'))} 
                      value={rollDate.d} 
                      onChange={(v) => {
                        const newDate = `${rollDate.y}-${rollDate.m}-${v}`;
                        setRollDate({...rollDate, d: v});
                        setFormData({...formData, emergenceDate: newDate, hatchDate: newDate, setDate: newDate});
                      }} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>後食開始日</label>
                  <input type="date" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring}`} value={formData.feedingStartDate} onChange={e => setFormData({...formData, feedingStartDate: e.target.value})} />
                </div>
              </>
            )}

            {formData.status === 'Adult' && (
              <div className="space-y-1 col-span-2">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>死亡日 (★)</label>
                <input type="date" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring}`} value={formData.deathDate} onChange={e => setFormData({...formData, deathDate: e.target.value})} />
              </div>
            )}

            {formData.status === 'Larva' && (
              <div className="space-y-1 col-span-2">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>孵化日 / セット開始日</label>
                <input type="date" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring}`} value={formData.hatchDate} onChange={e => setFormData({...formData, hatchDate: e.target.value})} />
              </div>
            )}

            {formData.status === 'SpawnSet' && (
              <>
                <div className="space-y-1 col-span-2">
                  <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>セット日</label>
                  <input type="date" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring}`} value={formData.setDate} onChange={e => setFormData({...formData, setDate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>使用マット</label>
                  <input className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring}`} value={formData.substrate} onChange={e => setFormData({...formData, substrate: e.target.value})} placeholder="完熟マット" />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>容器サイズ</label>
                  <input className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring}`} value={formData.containerSize} onChange={e => setFormData({...formData, containerSize: e.target.value})} placeholder="中ケース" />
                </div>
                <LevelSelector label="水分量 (1-5)" value={formData.moisture} onChange={(v) => setFormData({...formData, moisture: v})} />
                <LevelSelector label="詰圧 (1-5)" value={formData.packingPressure} onChange={(v) => setFormData({...formData, packingPressure: v})} />
                <div className="space-y-1">
                  <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>温度設定</label>
                  <input type="number" step="0.1" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring}`} value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})} placeholder="25.0" />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>同居の有無</label>
                  <select className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring}`} value={formData.cohabitation} onChange={e => setFormData({...formData, cohabitation: e.target.value})}>
                    <option value="No" className="bg-slate-800">なし (メスのみ)</option>
                    <option value="Yes" className="bg-slate-800">あり (ペアリング中)</option>
                  </select>
                </div>
              </>
            )}

            {!isEditing && (
              <div className="space-y-1 col-span-2">
                <div className="flex justify-between items-center ml-1">
                  <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest`}>登録頭数 (連番で作成)</label>
                  <span className="text-[8px] font-black text-white/20 uppercase italic">Last Field</span>
                </div>
                <input ref={countRef} type="number" min="1" max="50" className={`w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring} transition-all`} value={formData.count || 1} onChange={e => setFormData({...formData, count: parseInt(e.target.value) || 1})} />
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-white/5 border-t border-white/10 shrink-0">
          <button ref={saveRef} onClick={handleLocalSave} className={`w-full bg-gradient-to-r ${currentAccent.buttonFrom} ${currentAccent.buttonTo} text-white py-5 rounded-[2rem] font-black text-lg ${currentAccent.shadow} active:scale-95 transition-all`}>
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