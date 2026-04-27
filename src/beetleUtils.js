export const CATEGORIES = {
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
    const stats = Array.isArray(beetles) ? beetles.filter(b => b && b.id).reduce((acc, b) => {
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
        if (!isNaN(start) && !isNaN(end)) targetGroup.larvalPeriods.push({ name: b.name, value: Math.ceil(Math.abs(end - start) / 86400000) });
      }
      if (b.emergenceDate && b.feedingStartDate && !b.isDigOut) {
        const start = new Date(b.emergenceDate);
        const end = new Date(b.feedingStartDate);
        if (!isNaN(start) && !isNaN(end)) targetGroup.restingPeriods.push({ name: b.name, value: Math.ceil(Math.abs(end - start) / 86400000) });
      }
      if (b.adultSize) targetGroup.sizes.push({ name: b.name, value: parseFloat(b.adultSize) });
      
      if (b.status === 'SpawnSet') targetGroup.spawnSetIds.push(b.id);
      return acc;
    }, {}) : {};

    return Object.values(stats).filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
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