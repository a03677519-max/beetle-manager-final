export const calculateDaysBetweenDates = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end)) return null;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const CATEGORIES = {
  Adults: '成虫',
  Larvae: '幼虫',
  SpawnSets: '産卵セット',
  Pupas: '蛹'
};

export const getInitials = (sci) => {
  if (typeof sci !== 'string' || !sci) return "";
  return sci.trim().split(/\s+/).filter(s => s.length > 0).map(s => s[0].toUpperCase()).join("");
};

export const getStatSummary = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return { avg: '-', min: '-', max: '-' };
  const values = arr.map(item => item?.value).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return { avg: '-', min: '-', max: '-' };
  return {
    avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
    min: Math.min(...values).toFixed(1),
    max: Math.max(...values).toFixed(1)
  };
};

export const calculateLarvalPeriodDays = (beetle) => {
  if (!beetle.hatchDate) return null;
  const startDate = beetle.hatchDate;
  // 羽化日が設定されていればそれまで、そうでなければ今日まで
  const endDate = beetle.emergenceDate || new Date().toISOString().split('T')[0];
  return calculateDaysBetweenDates(startDate, endDate);
};

export const calculateAdultLifespanDays = (beetle) => {
  if (!beetle.emergenceDate) return null;
  const startDate = beetle.emergenceDate;
  const endDate = beetle.deathDate || new Date().toISOString().split('T')[0]; // 死亡日が設定されていなければ今日まで
  return calculateDaysBetweenDates(startDate, endDate);
};

export const getAutoTasks = (beetle) => {
  const autoTasks = [];
  if (!beetle || beetle.archived || !beetle.id) return autoTasks;

  const now = new Date();
  const records = beetle.records || [];
  if (beetle.status === 'Larva') {
    const lastRecordDate = records.length > 0 
      ? new Date(records[records.length - 1]?.date || 0)
      : (beetle.hatchDate ? new Date(beetle.hatchDate) : new Date(parseInt(beetle.id)));
    
    const limitDate = new Date(lastRecordDate);
    limitDate.setMonth(limitDate.getMonth() + 3);
    if (now > limitDate) autoTasks.push({ id: `auto-l-${beetle.id}`, type: '交換時期 (3ヶ月経過)', isAuto: true });
  }

  if (beetle.status === 'SpawnSet' && beetle.setDate) {
    const setDate = new Date(beetle.setDate);
    const limitDate = new Date(setDate);
    limitDate.setMonth(limitDate.getMonth() + 1);
    if (now > limitDate) autoTasks.push({ id: `auto-s-${beetle.id}`, type: '割り出し時期 (1ヶ月経過)', isAuto: true });
  }
  return autoTasks;
};

export const calculateBeetleStats = (beetles, searchTerm = '') => {
  try {
    if (!Array.isArray(beetles)) return [];
    const stats = beetles.filter(b => b && b.id && !b.archived).reduce((acc, b) => {
      const name = b.scientificName || '学名未設定';
      if (!acc[name]) {
        acc[name] = {
          name, speciesNames: new Set(), count: 0, larvalPeriods: [],
          restingPeriods: [], sizes: [], temps: [], lifespans: [],
          spawnSetRankings: [], substrates: new Set(), spawnSetData: [], spawnSetIds: [] 
        };
      }
      
      const targetGroup = acc[name];
      targetGroup.count++;
      if (b.species) targetGroup.speciesNames.add(String(b.species));
      
      if (b.hatchDate && b.emergenceDate) {
        const start = new Date(b.hatchDate);
        const end = new Date(b.emergenceDate);
        const diff = Math.ceil(Math.abs(end - start) / 86400000);
        if (!isNaN(diff)) targetGroup.larvalPeriods.push({ name: b.name || 'Unknown', value: diff });
      }
      if (b.emergenceDate && b.feedingStartDate && !b.isDigOut) {
        const start = new Date(b.emergenceDate);
        const end = new Date(b.feedingStartDate);
        const diff = Math.ceil(Math.abs(end - start) / 86400000);
        if (!isNaN(diff)) targetGroup.restingPeriods.push({ name: b.name || 'Unknown', value: diff });
      }
      if (b.adultSize && !isNaN(parseFloat(b.adultSize))) {
        targetGroup.sizes.push({ name: b.name || 'Unknown', value: parseFloat(b.adultSize) });
      }
      
      if (b.status === 'SpawnSet') targetGroup.spawnSetIds.push(b.id);
      return acc;
    }, {});

    return Object.values(stats).filter(g => 
      g && g.name && g.name.toLowerCase().includes((searchTerm || '').toLowerCase())
    );
  } catch (err) {
    console.error("Stats calculation error:", err);
    return [];
  }
};

export const calculateDaysToEmergence = (beetle) => {
  const start = beetle.hatchDate ? new Date(beetle.hatchDate) : new Date(parseInt(beetle.id));
  const end = beetle.emergenceDate ? new Date(beetle.emergenceDate) : null;
  if (!end) return null;
  return Math.ceil(Math.abs(end - start) / 86400000);
};

export const parseBeetleText = (text) => {
  if (!text) return {};
  const lines = text.split('\n');
  const data = { records: [] };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('和名')) {
      data.species = trimmed.replace('和名', '').trim();
    } else if (trimmed.startsWith('学名')) {
      data.scientificName = trimmed.replace('学名', '').trim();
    } else if (trimmed.startsWith('産地')) {
      data.locality = trimmed.replace('産地', '').trim();
    } else if (trimmed.startsWith('累代')) {
      const parts = trimmed.replace('累代', '').trim().split(/\s+/);
      if (parts[0]) data.generation = parts[0];
      if (parts[1]) data.name = parts[1];
      if (parts[2]) data.hatchDate = parts[2];
    } else if (line.startsWith(' ') && line.includes('水') && line.includes('圧')) {
      // 5行目以降の履歴データのパース: " [date] [substrate] 水[moisture] 圧[packing] [size] [stage]"
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 6) {
        data.records.push({
          id: Date.now() + idx,
          date: parts[0], // Assuming date is YYYY-MM-DD
          substrate: parts[1],
          moisture: parseInt(parts[2].replace('水', '')) || 3,
          packingPressure: parts[3].replace('圧', ''),
          containerSize: parts[4],
          stage: parts[5]
        });
      }
    } else if (line.includes('羽化・堀')) {
      const parts = trimmed.split(/\s+/);
      const dates = parts.filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p));
      if (dates[0]) {
        data.emergenceDate = dates[0];
        data.status = 'Adult';
      }
      if (dates[1]) data.feedingStartDate = dates[1];
    }
  });

  if (!data.status) {
    if (data.records.some(r => r.stage === 'Pupa')) data.status = 'Pupa';
    else if (data.records.length > 0) data.status = 'Larva';
    else data.status = 'Adult';
  }

  return data;
};

/**
 * 個体データをCSV形式に変換する
 */
export const convertToCSV = (beetles) => {
  if (!beetles || beetles.length === 0) return "";
  
  const headers = ["ID", "管理名", "状態", "和名", "学名", "産地", "累代", "孵化日", "羽化日", "サイズ(mm)", "死亡日", "備考"];
  const rows = beetles.map(b => [
    b.id,
    `"${(b.name || "").replace(/"/g, '""')}"`,
    b.status || "",
    `"${(b.species || "").replace(/"/g, '""')}"`,
    `"${(b.scientificName || "").replace(/"/g, '""')}"`,
    `"${(b.locality || "").replace(/"/g, '""')}"`,
    b.generation || "",
    b.hatchDate || "",
    b.emergenceDate || "",
    b.adultSize || "",
    b.deathDate || "",
    `"${(b.notes || "").replace(/"/g, '""')}"`
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
};

/**
 * インポートデータが有効な形式かチェックする
 */
export const isValidBeetleData = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.beetles)) return false;
  // 必須フィールドの簡易チェック
  return data.beetles.every(b => b && typeof b === 'object' && b.id);
};