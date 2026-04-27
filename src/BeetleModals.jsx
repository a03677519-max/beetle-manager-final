import React, { useRef, useCallback, useEffect } from 'react';
import { X, Copy, Edit3, Bug, Ghost, Trash2, Scale, Activity, Thermometer, MessageSquare, Crown, RefreshCw, ArrowUpDown, Camera, Image as ImageIcon, Plus } from 'lucide-react';
import { CATEGORIES, calculateLarvalPeriodDays, calculateAdultLifespanDays, calculateDaysBetweenDates } from './beetleUtils.js';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

/**
 * ロール式セレクターコンポーネント
 */
export const WheelPicker = ({ options, value, onChange, className = "" }) => {
  const wheelRef = useRef(null);
  const itemHeight = 40;
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef(null);

  const handleScroll = useCallback((e) => {
    isScrollingRef.current = true;
    const scrollTop = Math.max(0, e.target.scrollTop);
    const index = Math.round(scrollTop / itemHeight);
    
    if (options[index] !== undefined && options[index].toString() !== value?.toString()) {
      if (window.navigator.vibrate) window.navigator.vibrate(10);
      onChange(options[index]);
    }

    // スクロール停止判定
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, [options, value, onChange, itemHeight]);

  useEffect(() => {
    // 手動スクロール中でない場合のみ、外部からの値変更を位置に反映
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
        onTouchStart={(e) => e.stopPropagation()}
        className="h-full overflow-y-auto picker-wheel py-[40px] px-2 overscroll-contain snap-y snap-mandatory scrollbar-none"
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
export const DateRollSelector = ({ label, value, onChange, accentColorClass = "text-emerald-400" }) => {
  const d = value ? new Date(value) : new Date();
  const y = d.getFullYear().toString();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');

  const handleUpdate = (part, val) => {
    const newY = part === 'y' ? val : y;
    const newM = part === 'm' ? val : m;
    const newD = part === 'd' ? val : day;
    onChange(`${newY}-${newM}-${newD}`);
  };

  return (
    <div className="space-y-2 col-span-2">
      <label className={`text-[10px] ${accentColorClass} font-black uppercase tracking-widest ml-1`}>{label} (ロール選択)</label>
      <div className="grid grid-cols-3 gap-1 bg-white/5 rounded-2xl p-1 border border-white/10">
        <WheelPicker options={Array.from({length: 11}, (_, i) => (new Date().getFullYear() - 5 + i).toString())} value={y} onChange={(v) => handleUpdate('y', v)} />
        <WheelPicker options={Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'))} value={m} onChange={(v) => handleUpdate('m', v)} />
        <WheelPicker options={Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'))} value={day} onChange={(v) => handleUpdate('d', v)} />
      </div>
      <p className="text-[9px] text-white/30 text-center font-bold mt-1">選択中: {value || '未設定'}</p>
    </div>
  );
};

// ヘルパーコンポーネント (CommonUI.jsx がない場合の暫定定義)
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-1 border-b border-white/5">
    <span className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest">{label}</span>
    <span className="text-xs font-black text-white/90">{value || '-'}</span>
  </div>
);

const LineageSection = ({ beetle, beetles, onSelectBeetle }) => {
  const father = beetles.find(b => b && (b.id === beetle.parentMaleId || b.name === beetle.parentMaleId));
  const mother = beetles.find(b => b && (b.id === beetle.parentFemaleId || b.name === beetle.parentFemaleId));
  return (
    <div className="mt-4 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-inner">
      <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest mb-2">Lineage (血統情報)</p>
      <div className="grid grid-cols-2 gap-2">
        <div 
          className={`bg-white/5 p-2 rounded-lg border border-white/10 shadow-inner ${father ? 'cursor-pointer active:scale-95 transition-all hover:bg-white/10' : ''}`}
          onClick={() => father && onSelectBeetle(father)}
        >
          <p className="text-[8px] text-blue-400 font-bold">♂ Father</p>
          <p className="text-[10px] font-black truncate text-white/90">{father ? father.name : (beetle.parentMaleId || '不明')}</p>
        </div>
        <div 
          className={`bg-white/5 p-2 rounded-lg border border-white/10 shadow-inner ${mother ? 'cursor-pointer active:scale-95 transition-all hover:bg-white/10' : ''}`}
          onClick={() => mother && onSelectBeetle(mother)}
        >
          <p className="text-[8px] text-pink-400 font-bold">♀ Mother</p>
          <p className="text-[10px] font-black truncate text-white/90">{mother ? mother.name : (beetle.parentFemaleId || '不明')}</p>
        </div>
      </div>
    </div>
  );
};

const OffspringSection = ({ beetle, beetles, onSelectBeetle }) => {
  const offspring = beetles.filter(b => b && (
    b.parentMaleId === beetle.id || 
    b.parentFemaleId === beetle.id || 
    (beetle.name && (b.parentMaleId === beetle.name || b.parentFemaleId === beetle.name))
  ));

  if (offspring.length === 0) return null;

  // 羽化済み（Adult）個体から最大サイズを抽出
  const adultOffspringSizes = offspring
    .filter(b => b.status === 'Adult' && b.adultSize)
    .map(b => parseFloat(b.adultSize))
    .filter(size => !isNaN(size));

  const maxSize = adultOffspringSizes.length > 0 ? Math.max(...adultOffspringSizes) : null;

  return (
    <div className="mt-4 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-inner">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">Offspring (子個体リスト)</p>
        {maxSize && (
          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <Crown size={10} className="text-amber-400" />
            <span className="text-[9px] font-black text-amber-400">MAX: {maxSize}mm</span>
          </div>
        )}
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
        {offspring.map(child => (
          <div 
            key={child.id} 
            onClick={() => onSelectBeetle(child)}
            className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/10 active:scale-95 transition-all hover:bg-white/10 cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[10px] font-black text-white/90 truncate">{child.name}</span>
              <span className="text-[8px] text-white/40 italic truncate">{child.species}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {child.status === 'Adult' && child.adultSize && (
                <span className="text-[9px] font-black text-emerald-400">{child.adultSize}mm</span>
              )}
              <span className="text-[8px] font-black px-2 py-0.5 rounded bg-white/10 text-white/60 border border-white/5">{child.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BeetleDetailModal = ({ 
  beetle, onClose, beetles, config, onCopy, onEdit, onEmergence, onDeath, onRevert, onDelete, onUpdateImages, onOpenLightbox, onSelectBeetle,
  newWeight, setNewWeight, newTemp, setNewTemp, newLog, setNewLog, fetchSbTemp, isFetchingSb, onAddRecord, 
  editingRecord, setEditingRecord, onUpdateRecord, onDeleteRecord
}) => {
  if (!beetle) return null;

  // プログレスバー用の最大期間 (目安)
  const MAX_LARVAL_PERIOD_DAYS = 730; // 2年
  const MAX_ADULT_LIFESPAN_DAYS = 365; // 1年

  // 幼虫期間の計算
  const larvalPeriodDays = calculateLarvalPeriodDays(beetle);
  const larvalPeriodLabel = beetle.emergenceDate ? '幼虫期間合計' : '幼虫期間経過';

  // 成虫期間の計算
  const adultLifespanDays = calculateAdultLifespanDays(beetle);
  const adultLifespanLabel = beetle.deathDate ? '成虫期間合計' : '成虫期間経過';

  const ProgressBar = ({ label, value, max, accentColorClass }) => {
    const percentage = Math.min(100, (value / max) * 100);
    const displayValue = value !== null ? `${value}日` : '-';

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-white/60">{label}</span>
          <span className={`${accentColorClass}`}>{displayValue}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          {value !== null && (
            <div
              className={`h-full rounded-full ${accentColorClass.replace('text-', 'bg-')}`}
              style={{ width: `${percentage}%` }}
            ></div>
          )}
        </div>
      </div>
    );
  };

  // 画像追加の処理
  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    })).then(base64s => {
      onUpdateImages(beetle.id, [...(beetle.images || []), ...base64s]);
    });
  };

  const handleDeletePhoto = (index) => {
    if (!window.confirm('この写真を削除しますか？')) return;
    const updated = beetle.images.filter((_, i) => i !== index);
    onUpdateImages(beetle.id, updated);
  };

  // 状態に応じたアクセントカラー設定
  const accentColors = {
    Larva: {
      text: 'text-amber-400',
      textMuted: 'text-amber-400/60',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    Adult: {
      text: 'text-emerald-400',
      textMuted: 'text-emerald-400/60',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    SpawnSet: {
      text: 'text-rose-400',
      textMuted: 'text-rose-400/60',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    },
    Pupa: {
      text: 'text-indigo-400',
      textMuted: 'text-indigo-400/60',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
    }
  };

  const currentAccent = accentColors[beetle.status] || accentColors.Adult;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex flex-col overscroll-none" onClick={onClose}>
      <div className="bg-white/10 backdrop-blur-2xl mt-12 flex-1 rounded-t-[3rem] overflow-hidden flex flex-col border border-white/20 shadow-2xl overscroll-contain" onClick={e => e.stopPropagation()}>
        <div className="bg-white/5 backdrop-blur-md text-white p-6 flex justify-between items-center border-b border-white/10">
          <h2 className={`text-xl font-black tracking-tight ${currentAccent.text}`}>{(CATEGORIES[beetle.status + 's'] || '個体')}詳細</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1"><X size={28} /></button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto text-white space-y-6">
          <div className={`p-6 rounded-[2rem] border ${currentAccent.bg} ${currentAccent.border} shadow-inner relative overflow-hidden group`}>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:animate-[sweep_3s_infinite]" />
            <h3 className="text-2xl font-black text-white relative z-10">{beetle.name}</h3>
            <div className={`inline-block mt-2 px-3 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${currentAccent.badge}`}>
              {config.labels[beetle.status] || '未設定'}
            </div>
            <div className="space-y-1 mt-4">
              <InfoRow label="産地" value={beetle.locality} />
              <InfoRow label="累代" value={beetle.generation} />
              {beetle.status === 'Adult' && (
                <>
                  <InfoRow label="羽化日" value={`${beetle.emergenceDate || '-'} ${beetle.isDigOut ? '(掘出)' : '(羽化確認)'}`} />
                  <InfoRow label="後食開始" value={beetle.feedingStartDate} />
                  <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[9px] text-emerald-400/60 font-black uppercase mb-1">幼虫時データ要約</p>
                    <p className="text-[10px] text-white/80 leading-relaxed">
                      孵化から羽化まで {beetle.hatchDate && beetle.emergenceDate ? calculateDaysBetweenDates(beetle.hatchDate, beetle.emergenceDate) : '?'} 日で推移。
                      最大体重: {beetle.records?.length > 0 ? Math.max(...beetle.records.map(r => r.weight || 0)) : '-'}g
                    </p>
                  </div>
                </>
              )}
              {beetle.status === 'Larva' && beetle.emergenceDate && (
                <div className="mt-2 p-3 bg-white/5 rounded-xl border border-amber-500/20">
                  <p className="text-[9px] text-amber-400/60 font-black uppercase mb-1">羽化まであと何日（目安）</p>
                  <p className="text-[10px] text-white/80">
                    羽化まであと <span className="text-amber-400 font-black">{calculateDaysBetweenDates(new Date().toISOString().split('T')[0], beetle.emergenceDate)}</span> 日（予定）
                  </p>
                </div>
              )}
              {beetle.status === 'SpawnSet' && (
                <InfoRow label="セット日" value={beetle.setDate} />
              )}
            </div>
            <div className="space-y-3 mt-6">
              {beetle.hatchDate && (
                <ProgressBar label={larvalPeriodLabel} value={larvalPeriodDays} max={MAX_LARVAL_PERIOD_DAYS} accentColorClass={currentAccent.text} />
              )}
              {beetle.emergenceDate && (
                <ProgressBar label={adultLifespanLabel} value={adultLifespanDays} max={MAX_ADULT_LIFESPAN_DAYS} accentColorClass={currentAccent.text} />
              )}
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => onCopy(beetle)} className={`${currentAccent.text} p-2 hover:bg-white/10 rounded-xl transition-all`}><Copy size={20}/></button>
              <button onClick={() => onEdit(beetle)} className="text-blue-400 p-2 hover:bg-white/10 rounded-xl transition-all"><Edit3 size={20}/></button>
              <button onClick={(e) => onDelete(beetle.id, e)} className="text-rose-400 p-2 hover:bg-white/10 rounded-xl transition-all"><Trash2 size={20}/></button>
            </div>
          </div>
          <LineageSection beetle={beetle} beetles={beetles} onSelectBeetle={onSelectBeetle} />
          <OffspringSection beetle={beetle} beetles={beetles} onSelectBeetle={onSelectBeetle} />

          {/* Photo Gallery Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest flex items-center gap-2">
                <Camera size={12} /> フォトギャラリー
              </p>
              <label className="cursor-pointer bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors border border-white/10 shadow-sm">
                <Plus size={16} className={currentAccent.text} />
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleAddPhotos} />
              </label>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar min-h-[120px]">
              {(beetle.images && beetle.images.length > 0) ? (
                beetle.images.map((img, idx) => (
                  <div key={idx} className="relative shrink-0 animate-in zoom-in duration-300">
                    <img 
                      src={img} 
                      alt={`Beetle ${idx}`} 
                      className="w-28 h-28 object-cover rounded-2xl border border-white/10 shadow-lg cursor-pointer"
                      onClick={() => onOpenLightbox(img)}
                    />
                    <button 
                      onClick={() => handleDeletePhoto(idx)}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-lg border border-white/20 active:scale-90"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="w-full h-28 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-white/20 italic gap-2">
                  <ImageIcon size={24} opacity={0.3} />
                  <span className="text-[10px]">写真なし</span>
                </div>
              )}
            </div>
          </div>

          {/* History & New Record Form */}
          <div className="space-y-6 pt-4">
             {/* Charts */}
             {beetle.records && beetle.records.length > 0 && (
               <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10 shadow-inner">
                 <p className="text-[10px] font-black text-amber-400/60 uppercase tracking-widest mb-4 flex justify-between items-center">
                   <span className="flex items-center gap-2"><Scale size={12}/> 成長・温度推移</span>
                   <span className="text-[8px] opacity-40">Weight(g) / Temp(℃) / Date</span>
                 </p>
                 <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={beetle.records}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" fontSize={8} stroke="rgba(255,255,255,0.3)" />
                        <YAxis fontSize={8} stroke="rgba(255,255,255,0.3)" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(2, 44, 34, 0.9)', border: 'none', borderRadius: '12px', fontSize: '10px', backdropFilter: 'blur(8px)' }} />
                        <Line type="monotone" dataKey="weight" name="体重" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24' }} />
                        <Line type="monotone" dataKey="temperature" name="温度" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                 </div>
               </div>
             )}

             {/* Add Record Form */}
             <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-inner space-y-5">
               <div className="flex justify-between items-center px-1">
                 <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">飼育ログ入力</p>
                 <button onClick={() => onAddRecord(beetle.id)} className={`px-5 py-2 rounded-xl font-black text-[10px] bg-emerald-500 text-white shadow-lg active:scale-95 transition-all`}>記録を保存</button>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <DateRollSelector label="日付" value={newLog.date} onChange={(v) => setNewLog({...newLog, date: v})} accentColorClass="text-emerald-400" />
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[8px] text-emerald-400 font-black uppercase mb-1">体重 (g)</p>
                      <input type="number" step="0.1" className="w-full bg-transparent text-sm font-bold outline-none text-white" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="0.0" />
                    </div>
                  </div>
                  {beetle.status === 'Larva' && (
                    <>
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl col-span-2 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[8px] text-emerald-400 font-black uppercase">管理詳細</p>
                          <div className="flex gap-2">
                            {['Unknown', 'Male', 'Female'].map(g => (
                              <button key={g} onClick={() => setNewLog({...newLog, gender: g})} className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-all ${newLog.gender === g ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-white/30'}`}>{g === 'Unknown' ? '?' : g === 'Male' ? '♂' : '♀'}</button>
                            ))}
                          </div>
                        </div>
                        <input className="w-full bg-white/5 p-3 rounded-xl text-[10px] outline-none border border-white/10 focus:border-emerald-500 transition-all" placeholder="使用マット・エサ名" value={newLog.substrate} onChange={e => setNewLog({...newLog, substrate: e.target.value})} />
                        <input className="w-full bg-white/5 p-3 rounded-xl text-[10px] outline-none border border-white/10 focus:border-emerald-500 transition-all" placeholder="ボトルサイズ (例: 800cc)" value={newLog.containerSize} onChange={e => setNewLog({...newLog, containerSize: e.target.value})} />
                        <div className="flex gap-2">
                           <div className="flex-1 space-y-1">
                             <p className="text-[7px] text-white/30 uppercase">水分</p>
                             <div className="flex gap-1">
                               {[1,2,3,4,5].map(v => <button key={v} onClick={() => setNewLog({...newLog, moisture: v})} className={`flex-1 py-1 rounded-md text-[8px] font-black border ${newLog.moisture === v ? 'bg-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/20'}`}>{v}</button>)}
                             </div>
                           </div>
                           <div className="flex-1 space-y-1">
                             <p className="text-[7px] text-white/30 uppercase">詰圧</p>
                             <div className="flex gap-1">
                               {[1,2,3,4,5].map(v => <button key={v} onClick={() => setNewLog({...newLog, packingPressure: v})} className={`flex-1 py-1 rounded-md text-[8px] font-black border ${newLog.packingPressure === v ? 'bg-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/20'}`}>{v}</button>)}
                             </div>
                           </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between col-span-2">
                    <div className="flex-1">
                      <p className="text-[8px] text-emerald-400 font-black uppercase mb-1">温度 (℃)</p>
                      <input type="number" step="0.1" className="w-full bg-transparent text-sm font-bold outline-none text-white" value={newTemp} onChange={e => setNewTemp(e.target.value)} placeholder="自動同期可" />
                    </div>
                    <button onClick={() => fetchSbTemp()} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-blue-400">
                      <RefreshCw size={18} className={isFetchingSb ? "animate-spin" : ""} />
                    </button>
                  </div>
               </div>

               {/* 加齢状況（ステージ）のドラムロール化 */}
               <div className="space-y-1">
                 <label className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest ml-1">加齢状況 (ロール選択)</label>
                 <div className="bg-white/5 rounded-2xl p-1 border border-white/10">
                   <WheelPicker 
                     options={['L1', 'L2', 'L3', 'Pupa', 'Adult']} 
                     value={newLog.stage} 
                     onChange={(v) => setNewLog({...newLog, stage: v})} 
                   />
                 </div>
               </div>
             </div>

             {/* History List */}
             <div className="space-y-3 pb-8">
               <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest ml-1">履歴一覧</p>
               {beetle.records && beetle.records.length > 0 ? (
                 [...beetle.records].reverse().map(rec => (
                   <div key={rec.id} className="bg-white/5 border border-white/10 p-5 rounded-[2rem] flex justify-between items-center group relative overflow-hidden">
                     <div className="relative z-10">
                       <div className="flex items-center gap-3 mb-1">
                         <span className="text-[10px] font-black text-emerald-400">{rec.date}</span>
                         <span className="text-[8px] px-2 py-0.5 bg-white/10 rounded-md font-bold uppercase tracking-tighter border border-white/5">{rec.stage}</span>
                       </div>
                       <p className="text-sm font-black text-white/90">
                         {rec.weight ? `${rec.weight}g` : '計測なし'} 
                         <span className="text-[10px] text-white/30 font-medium ml-3 italic">{rec.substrate || 'マット未設定'}</span>
                       </p>
                     </div>
                     <button onClick={() => onDeleteRecord(beetle.id, rec.id)} className="p-2 text-rose-400/30 hover:text-rose-400 transition-all active:scale-90"><Trash2 size={16}/></button>
                   </div>
                 ))
               ) : (
                 <div className="py-12 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest italic">記録なし</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LightboxModal = ({ image, onClose }) => {
  if (!image) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors p-2 z-[110]"
      >
        <X size={32} />
      </button>
      <img 
        src={image} 
        alt="Enlarged" 
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
};

// 他のモーダルコンポーネントの定義
export const EmergenceModal = ({ isOpen, onClose, formData, setFormData, onSubmit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-end overscroll-none" onClick={onClose}>
      <div className="bg-[#022c22]/90 backdrop-blur-3xl w-full rounded-t-[3rem] p-8 border-t border-white/20 shadow-2xl text-white animate-in slide-in-from-bottom duration-500 max-h-[80dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-emerald-400">羽化報告</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={28} /></button>
        </div>
        <div className="space-y-6">
          <DateRollSelector label="羽化日" value={formData.emergenceDate} onChange={(v) => setFormData({...formData, emergenceDate: v})} accentColorClass="text-emerald-400" />
          <div className="space-y-2">
            <label className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest ml-1">報告種別</label>
            <div className="flex gap-2">
              {[
                { id: false, label: '羽化確認' },
                { id: true, label: '掘り出し' }
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setFormData({...formData, isDigOut: opt.id})}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs border transition-all ${formData.isDigOut === opt.id ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onSubmit} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-5 rounded-[2rem] font-black text-lg shadow-lg active:scale-95 transition-all">羽化を記録</button>
        </div>
      </div>
    </div>
  );
};

export const DeathModal = ({ isOpen, onClose, formData, setFormData, onSubmit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-end overscroll-none" onClick={onClose}>
      <div className="bg-[#1a0a0a]/90 backdrop-blur-3xl w-full rounded-t-[3rem] p-8 border-t border-white/20 shadow-2xl text-white animate-in slide-in-from-bottom duration-500 max-h-[80dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-rose-400">死亡・★報告</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={28} /></button>
        </div>
        <div className="space-y-6">
          <DateRollSelector label="死亡日" value={formData.deathDate} onChange={(v) => setFormData({...formData, deathDate: v})} accentColorClass="text-rose-400" />
          <button onClick={onSubmit} className="w-full bg-gradient-to-r from-rose-700 to-rose-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-lg active:scale-95 transition-all">記録してアーカイブ</button>
        </div>
      </div>
    </div>
  );
};

export const StatGraphModal = ({ info, onClose, viewMode, setViewMode, sortConfig, setSortConfig, beetles, onSelectBeetle }) => {
  if (!info) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 overscroll-none" onClick={onClose}>
      <div className="bg-white/10 backdrop-blur-2xl w-full max-w-lg rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90dvh] border border-white/20 shadow-2xl overscroll-contain" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
          <h3 className="font-black text-white tracking-tight">{info.title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={28} /></button>
        </div>
        <div className="p-6 overflow-y-auto text-white">
          <div className="h-64 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={info.data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" hide stroke="rgba(255,255,255,0.4)" />
                <YAxis unit={info.unit} stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(2, 44, 34, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
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
              <div key={i} className="flex justify-between p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 text-xs font-black shadow-inner active:scale-95 transition-all cursor-pointer" onClick={() => onSelectBeetle(item.name)}>
                <span className="text-white/80">{item.name}</span>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end overscroll-none" onClick={onClose}>
      <div className="bg-white/10 backdrop-blur-2xl w-full rounded-t-[3rem] max-h-[90dvh] overflow-y-auto border-t border-white/20 shadow-2xl flex flex-col overscroll-contain" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-white/10 flex justify-between items-center sticky top-0 bg-white/5 backdrop-blur-md z-10">
          <h2 className="text-xl font-black text-white tracking-tight">一括交換記録</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={28} /></button>
        </div>
        <div className="p-8 space-y-8 text-white">
          <div className="grid grid-cols-2 gap-4">
             <DateRollSelector 
               label="交換日" 
               value={newLog.date} 
               onChange={(v) => setNewLog({...newLog, date: v})} 
               accentColorClass="text-emerald-400" 
             />
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-inner focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
               <div className="flex-1">
                 <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest mb-1">温度 (℃)</p>
                 <input type="number" step="0.1" className="w-full bg-transparent font-bold outline-none text-white" value={newTemp} onChange={e => setNewTemp(e.target.value)} />
               </div>
               <button onClick={() => onFetchTemp()} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-blue-400"><RefreshCw size={18} /></button>
             </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest ml-1">対象個体 ({selectedIds.size} / {targets.length})</p>
            <div className="grid grid-cols-1 gap-2">
              {targets.map(t => (
                <div key={t.id} onClick={() => onToggle(t.id)} className={`p-4 rounded-2xl border transition-all flex justify-between items-center cursor-pointer shadow-inner ${selectedIds.has(t.id) ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10 opacity-60'}`}>
                  <span className="text-sm font-black">{t.name}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.has(t.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                    {selectedIds.has(t.id) && <X size={12} className="rotate-45" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onSubmit} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-5 rounded-[2rem] font-black text-lg shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] active:scale-95 transition-all">選択した個体に記録を反映</button>
        </div>
      </div>
    </div>
  );
};

/**
 * バックアップ履歴から復元するモーダル
 */
export const BackupHistoryModal = ({ isOpen, onClose, history, onRestore }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-end overscroll-none" onClick={onClose}>
      <div className="bg-slate-900/90 backdrop-blur-3xl w-full rounded-t-[3rem] p-8 border-t border-white/20 shadow-2xl text-white animate-in slide-in-from-bottom duration-500 max-h-[80dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black text-emerald-400 tracking-tight">バックアップ履歴</h2>
            <p className="text-[10px] text-white/40 font-bold uppercase mt-1">過去5件の自動保存から復元できます</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={28} /></button>
        </div>
        <div className="space-y-3">
          {history && history.length > 0 ? (
            history.map((item, idx) => (
              <button 
                key={idx}
                onClick={() => onRestore(item)}
                className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-2xl active:scale-95 transition-all hover:bg-white/10 group"
              >
                <div className="text-left">
                  <p className="text-sm font-black text-white/90">{item.backupDate}</p>
                  <p className="text-[10px] text-white/40 font-bold">{item.beetles?.length || 0} 頭の個体データ</p>
                </div>
                <RefreshCw size={18} className="text-emerald-500 opacity-40 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-white/20 italic text-sm">履歴が見つかりません</div>
          )}
        </div>
      </div>
    </div>
  );
};