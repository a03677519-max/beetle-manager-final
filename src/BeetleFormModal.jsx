import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, Upload, RefreshCw } from 'lucide-react';

/**
 * ロール式セレクターコンポーネント
 */
const WheelPicker = ({ options, value, onChange, className = "" }) => {
  const wheelRef = useRef(null);
  const itemHeight = 40; // px
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef(null);

  const handleScroll = useCallback((e) => {
    isScrollingRef.current = true;
    const scrollTop = Math.max(0, e.target.scrollTop);
    const index = Math.min(options.length - 1, Math.max(0, Math.round(scrollTop / itemHeight)));
    
    if (options[index] !== undefined && options[index].toString() !== value?.toString()) {
      if (window.navigator.vibrate) window.navigator.vibrate(5); // より鋭いクリック感
      onChange(options[index]);
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, [options, value, onChange, itemHeight]);

  useEffect(() => {
    if (wheelRef.current && value !== undefined && !isScrollingRef.current) {
      const strValue = value?.toString() || '';
      const index = options.findIndex(opt => opt?.toString() === strValue);
      if (index !== -1) {
        const targetTop = index * itemHeight;
        if (Math.abs(wheelRef.current.scrollTop - targetTop) > 1) {
          wheelRef.current.scrollTop = targetTop;
        }
      }
    }
  }, [value, options]);

  return (
    <div className={`relative h-[120px] overflow-hidden picker-viewport ${className}`}>
      <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-white/10 border-y border-white/20 pointer-events-none z-10" />
      <div 
        ref={wheelRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto overflow-x-hidden picker-wheel py-[40px] px-2 overscroll-contain snap-y snap-mandatory scrollbar-none touch-pan-y"
      >
        {options.map((opt, i) => (
          <div key={i} className={`h-10 flex items-center justify-center text-sm font-black transition-all picker-item snap-center ${opt.toString() === value?.toString() ? 'text-white scale-110' : 'text-white/20'}`}>
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 年月日をまとめてロール選択するコンポーネント
 */
const DateRollSelector = ({ label, value, onChange, accentColorClass = "text-emerald-400" }) => {
  const now = new Date();
  const curY = now.getFullYear().toString();
  const curM = (now.getMonth() + 1).toString().padStart(2, '0');
  const curD = now.getDate().toString().padStart(2, '0');

  // タイムゾーンによるズレを防ぐため、Dateオブジェクトではなく文字列を直接パース
  const dateParts = value && value.includes('-') ? value.split('-') : [];
  const y = dateParts[0] || '-'; // valueが空の場合は'-'を初期値とする
  const m = dateParts[1] || '-'; // valueが空の場合は'-'を初期値とする
  const day = dateParts[2] || '-'; // valueが空の場合は'-'を初期値とする

  const handleUpdate = (part, val) => {
    let updatedY = part === 'y' ? val : y;
    let updatedM = part === 'm' ? val : m;
    let updatedD = part === 'd' ? val : day;

    // 「-」が選択された場合、または未選択の項目は今日の日付で補完
    const finalY = updatedY === '-' ? curY : updatedY;
    const finalM = updatedM === '-' ? curM : updatedM;
    const finalD = updatedD === '-' ? curD : updatedD;

    // もし元々日付が空で、かつ全ての項目が今日の日付で補完された場合は、空文字列を返す
    // これは、ユーザーが何も操作していない状態と、今日の日付を明示的に選択した状態を区別するため
    if (!value && finalY === curY && finalM === curM && finalD === curD) {
      onChange(''); 
    } else {
      onChange(`${finalY}-${finalM}-${finalD}`);
    }

  };

  return (
    <div className="space-y-1 col-span-2">
      <label className={`text-[10px] ${accentColorClass} font-black uppercase tracking-widest ml-1`}>{label}</label>
      <div className="grid grid-cols-3 gap-1 bg-white/5 rounded-2xl p-0.5 border border-white/10">
        <WheelPicker 
          options={['-', ...Array.from({length: 11}, (_, i) => (new Date().getFullYear() - 5 + i).toString())]} 
          value={y} 
          onChange={(v) => handleUpdate('y', v)} 
        />
        <WheelPicker 
          options={['-', ...Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'))]} 
          value={m} 
          onChange={(v) => handleUpdate('m', v)} 
        />
        <WheelPicker 
          options={['-', ...Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'))]} 
          value={day} 
          onChange={(v) => handleUpdate('d', v)} 
        />
      </div>
      <p className="text-[8px] text-white/20 text-center font-bold">Selected: {value || '未設定'}</p>
    </div>
  );
};

const BeetleFormModal = ({ 
  isOpen, onClose, formData, setFormData, isEditing, onSave, onImport,
  existingNames, existingSpecies, existingScientificNames, existingLocalities, existingGenerations,
  fetchSbTemperature, isFetchingSb
}) => {
  if (!isOpen) return null;

  // 各入力項目へのフォーカス制御用Ref
  const nameRef = useRef(null);
  const speciesRef = useRef(null);
  const sciRef = useRef(null);
  const locRef = useRef(null);
  const saveRef = useRef(null);
  const [hasEmerged, setHasEmerged] = useState(false); // 幼虫時の羽化トグル

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
    }
  };

  const currentAccent = accentColors[formData.status] || accentColors.Adult; // デフォルトはAdult

  // 累代の3カラムパース - 初期値を動的に決定
  // 累代の3カラムパース - 初期値を動的に決定
  const initializeGenerationState = () => {
    const genStr = formData.generation || '';
    let g1 = '-', g2 = '-', g3 = '-';
    
    if (genStr === '' || genStr === '-') {
      return { g1, g2, g3 };
    }

    // CBFやWFのような複合パターンを先にチェック
    const matchCBF = genStr.match(/^(CBF)(\d*)$/);
    const matchWF = genStr.match(/^(WF)(\d*)$/);
    const matchCB = genStr.match(/^(CB)(\d*)$/);
    const matchWD = genStr.match(/^(WD)(\d*)$/);

    if (matchCBF) {
      g1 = 'CB'; g2 = 'CBF'; g3 = matchCBF[2] || '-';
    } else if (matchWF) {
      g1 = 'WD'; g2 = 'WF'; g3 = matchWF[2] || '-';
    } else if (matchCB) {
      g1 = 'CB'; g2 = '-'; g3 = matchCB[2] || '-';
    } else if (matchWD) {
      g1 = 'WD'; g2 = '-'; g3 = matchWD[2] || '-';
    } else if (/^\d+$/.test(genStr)) { // 数字のみの場合 (例: "1")
      g1 = 'CB'; // デフォルトでCBとする
      g3 = genStr;
    }
    return { g1, g2, g3 };
  };
  
  const initialGen = initializeGenerationState();
  const [gen1, setGen1] = useState(initialGen.g1 || '-');
  const [gen2, setGen2] = useState(initialGen.g2 || '-');
  const [gen3, setGen3] = useState(initialGen.g3 || '-');
  
  // モーダルが開き直された時に状態をリセット
  useEffect(() => {
    if (isOpen) {
      const gen = initializeGenerationState();
      setGen1(gen.g1 || '-');
      setGen2(gen.g2 || '-');
      setGen3(gen.g3 || '-');
    }
  }, [isOpen]); // formData.generationへの依存を削除し、開いた時のリセットを優先

  const updateGen = (g1, g2, g3) => {
    let generationString = '';
    if (g1 === '-') { // g1が未選択なら全体も未選択
      generationString = '';
    } else {
      if (g2 !== '-') { // g2 (WF/CBF)が選択されていればそれを優先
        generationString = g2;
      } else { // g2が未選択ならg1 (WD/CB)を使用
        generationString = g1;
      }
      if (g3 !== '-') { // g3 (世代数)が選択されていれば追加
        generationString += g3;
      }
    }
    
    setFormData({ 
      ...formData, 
      generation: generationString,
      _genState: { g1, g2, g3 } // 状態保持用
    });
  };

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
            className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-all ${value === lv ? `${currentAccent.chipActiveBg} text-white border-white/40 shadow-lg` : 'bg-white/5 border-white/10 text-white/30'}`}
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
      <div className="bg-white/10 backdrop-blur-2xl w-full rounded-t-[3rem] animate-slide-up max-h-[85dvh] flex flex-col overflow-x-hidden border-t border-white/20 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 bg-white/5 backdrop-blur-md border-b border-white/10 shrink-0">
          <h2 className={`text-xl font-black text-white tracking-tight`}>{isEditing ? '個体情報を編集' : '新規個体を登録'}</h2>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1"><X size={28} /></button>
          </div>
        </div>
        
        <div className="p-4 space-y-3 overflow-y-auto overflow-x-hidden flex-1 text-white">
          <div className="space-y-2">
            <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>状態</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: 'Larva', label: '幼虫' },
                { id: 'Adult', label: '成虫' },
                { id: 'SpawnSet', label: '産卵' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setFormData({...formData, status: opt.id}); setHasEmerged(false); }}
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1 col-span-2">
              <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>管理名 / 識別ID</label>
              <input ref={nameRef} list="name-options" className={`w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例: 24HE-01" />
            </div>
            {!isEditing && (
              <div className="space-y-1 col-span-1">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>個体数</label>
                <div className="bg-white/5 rounded-2xl p-0.5 border border-white/10">
                  <WheelPicker 
                    options={[...Array.from({length: 50}, (_, i) => (i + 1).toString())]} 
                    value={(formData.count || 1).toString()} 
                    onChange={(v) => setFormData({...formData, count: parseInt(v) || 1})} 
                  />
                </div>
              </div>
            )}
            <div className="space-y-1 col-span-1">
              <div className="flex justify-between items-center ml-1">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest`}>種類 (和名)</label>
              </div>
              <input ref={speciesRef} list="species-options" className={`w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring} transition-all`} value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} placeholder="ヘラクレス" />
            </div>
            <div className="space-y-1 col-span-1">
              <div className="flex justify-between items-center ml-1">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest`}>学名</label>
              </div>
              <input ref={sciRef} list="scientific-name-options" className={`w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring} transition-all italic`} value={formData.scientificName} onChange={e => setFormData({...formData, scientificName: e.target.value})} placeholder="Dynastes hercules" />
            </div>
            <div className="space-y-1 col-span-1">
              <div className="flex justify-between items-center ml-1">
                <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest`}>産地</label>
              </div>
              <input ref={locRef} list="locality-options" className={`w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-white outline-none focus:ring-2 ${currentAccent.ring} transition-all`} value={formData.locality} onChange={e => setFormData({...formData, locality: e.target.value})} placeholder="グアドループ" />
            </div>

            {/* 累代ロールセレクター */}
            <div className="space-y-1 col-span-2">
              <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>累代 (WD/CB - 系統 - 世代)</label>
              <div className="grid grid-cols-3 gap-1 bg-white/5 rounded-2xl p-0.5 border border-white/10">
                <WheelPicker 
                  options={['-', 'WD', 'CB']} 
                  value={gen1} 
                  onChange={(v) => { setGen1(v); updateGen(v, gen2, gen3); }} 
                />
                <WheelPicker 
                  options={['-', 'WF', 'CBF']} 
                  value={gen2} 
                  onChange={(v) => { setGen2(v); updateGen(gen1, v, gen3); }} 
                />
                <WheelPicker 
                  options={['-', ...Array.from({length: 30}, (_, i) => (i + 1).toString())]}
                  value={gen3} 
                  onChange={(v) => { setGen3(v); updateGen(gen1, gen2, v); }} 
                />
              </div>
              <p className="text-[10px] text-white/40 text-center font-black mt-1 tracking-widest">RESULT: <span className="text-white">{formData.generation || '未設定'}</span></p>
            </div>

            {/* 状態別の追加項目 */}
            {formData.status === 'Adult' && (
              <>
                <DateRollSelector label="羽化日" value={formData.emergenceDate} onChange={(v) => setFormData({...formData, emergenceDate: v})} accentColorClass={currentAccent.text} />
                <DateRollSelector label="後食開始日" value={formData.feedingStartDate} onChange={(v) => setFormData({...formData, feedingStartDate: v})} accentColorClass={currentAccent.text} />
                <DateRollSelector label="死亡日 (★)" value={formData.deathDate} onChange={(v) => setFormData({...formData, deathDate: v})} accentColorClass={currentAccent.text} />
                <div className="col-span-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                  <p className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest mb-1`}>幼虫時データ</p>
                  <p className="text-[11px] text-white/40 italic">※過去の飼育ログは登録後に「分析」または「詳細」から確認・紐づけできます</p>
                </div>
              </>
            )}

            {formData.status === 'Larva' && (
              <>
                <div className="col-span-2 space-y-3 p-3 bg-white/5 rounded-[2rem] border border-white/10 shadow-inner">
                  <p className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>初回飼育ログ (記録)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <DateRollSelector label="記録日 / 孵化日" value={formData.hatchDate || formData.initialRecordDate} onChange={(v) => setFormData({...formData, hatchDate: v, initialRecordDate: v})} accentColorClass={currentAccent.text} />
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-white/40 font-bold uppercase mb-1">体重 (g)</p>
                      <input type="number" step="0.1" className="w-full bg-transparent text-sm font-black outline-none" value={formData.initialRecordWeight} onChange={e => setFormData({...formData, initialRecordWeight: e.target.value})} placeholder="0.0" />
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-[8px] text-white/40 font-bold uppercase mb-1">温度 (℃)</p>
                        <input type="number" step="0.1" className="w-full bg-transparent text-sm font-black outline-none" value={formData.initialRecordTemperature} onChange={e => setFormData({...formData, initialRecordTemperature: e.target.value})} placeholder="25.0" />
                      </div>
                      <button type="button" onClick={() => fetchSbTemperature()} className="text-emerald-400 p-1"><RefreshCw size={14} className={isFetchingSb ? "animate-spin" : ""} /></button>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[8px] text-white/40 font-bold uppercase ml-1">加齢状況</label>
                      <div className="flex gap-1">
                        {['L1', 'L2', 'L3'].map(s => (
                          <button key={s} type="button" onClick={() => setFormData({...formData, initialRecordStage: s})} className={`flex-1 py-2 rounded-lg text-[10px] font-black border ${formData.initialRecordStage === s ? 'bg-amber-500 text-white border-amber-400' : 'bg-white/5 border-white/10 text-white/30'}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <input className="col-span-1 bg-white/5 p-3 rounded-xl border border-white/5 text-[10px] outline-none" placeholder="使用マット" value={formData.initialRecordSubstrate} onChange={e => setFormData({...formData, initialRecordSubstrate: e.target.value})} />
                    <input className="col-span-1 bg-white/5 p-3 rounded-xl border border-white/5 text-[10px] outline-none" placeholder="ボトル (800cc等)" value={formData.initialRecordContainerSize} onChange={e => setFormData({...formData, initialRecordContainerSize: e.target.value})} />
                    <LevelSelector label="水分 (1-5)" value={formData.initialRecordMoisture} onChange={(v) => setFormData({...formData, initialRecordMoisture: v})} />
                    <LevelSelector label="詰圧 (1-5)" value={formData.initialRecordPackingPressure} onChange={(v) => setFormData({...formData, initialRecordPackingPressure: v})} />
                  </div>
                </div>

                <div className="col-span-2">
                  <button 
                    type="button"
                    onClick={() => setHasEmerged(!hasEmerged)}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${hasEmerged ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">既に羽化している場合はチェック</span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${hasEmerged ? 'bg-emerald-500 border-emerald-400' : 'border-white/20'}`}>
                      {hasEmerged && <ChevronRight size={14} className="text-white" />}
                    </div>
                  </button>
                </div>

                {hasEmerged && (
                  <div className="col-span-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <DateRollSelector label="羽化日" value={formData.emergenceDate} onChange={(v) => setFormData({...formData, emergenceDate: v})} accentColorClass={currentAccent.text} />
                    <div className="space-y-1">
                      <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>羽化・報告種別</label>
                      <div className="flex gap-2">
                        {[{val: false, label: '羽化確認'}, {val: true, label: '掘り出し'}].map(opt => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setFormData({...formData, isDigOut: opt.val})}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-all ${
                              formData.isDigOut === opt.val 
                                ? `${currentAccent.chipActiveBg} text-white` 
                                : 'bg-white/5 border-white/10 text-white/30'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {formData.status === 'SpawnSet' && (
              <>
                <div className="col-span-3 grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-[2rem] border border-white/10">
                   <p className={`col-span-2 text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>親個体・血統データ</p>
                   <input list="name-options" className="bg-white/5 border border-white/5 p-3 rounded-xl text-xs outline-none" value={formData.parentMaleId} onChange={e => setFormData({...formData, parentMaleId: e.target.value})} placeholder="♂ 親ID" />
                   <input list="name-options" className="bg-white/5 border border-white/5 p-3 rounded-xl text-xs outline-none" value={formData.parentFemaleId} onChange={e => setFormData({...formData, parentFemaleId: e.target.value})} placeholder="♀ 親ID" />
                </div>

                <div className="col-span-3">
                  <DateRollSelector label="セット開始日" value={formData.setDate} onChange={(v) => setFormData({...formData, setDate: v})} accentColorClass={currentAccent.text} />
                </div>
                <input className="col-span-1 bg-white/5 border border-white/10 p-3 rounded-xl text-white text-xs outline-none" value={formData.substrate} onChange={e => setFormData({...formData, substrate: e.target.value})} placeholder="マット" />
                <input className="col-span-1 bg-white/5 border border-white/10 p-3 rounded-xl text-white text-xs outline-none" value={formData.containerSize} onChange={e => setFormData({...formData, containerSize: e.target.value})} placeholder="サイズ" />
                
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  <LevelSelector label="水分量 (1-5)" value={formData.moisture} onChange={(v) => setFormData({...formData, moisture: v})} />
                  <div className="space-y-1">
                    <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>設定温度 (℃)</label>
                    <div className="flex gap-2">
                      <input type="number" step="0.1" className="flex-1 bg-white/5 border border-white/10 p-3 rounded-2xl text-white outline-none" value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})} placeholder="25.0" />
                      <button type="button" onClick={() => fetchSbTemperature()} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-emerald-400"><RefreshCw size={18} className={isFetchingSb ? "animate-spin" : ""} /></button>
                    </div>
                  </div>
                </div>

                <div className="col-span-3 space-y-1">
                  <label className={`text-[10px] ${currentAccent.text} font-black uppercase tracking-widest ml-1`}>同居の有無</label>
                  <div className="flex gap-2">
                    {['No', 'Yes'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, cohabitation: opt})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-all ${formData.cohabitation === opt ? 'bg-rose-500 text-white' : 'bg-white/5 border-white/10 text-white/30'}`}
                      >
                        {opt === 'No' ? 'メスのみ' : 'ペアリング中'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 shrink-0">
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