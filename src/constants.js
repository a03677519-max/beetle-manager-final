export const CATEGORIES = { 
  Adults: '成虫', 
  Larvae: '幼虫', 
  SpawnSets: '産卵セット', 
  Pupas: '蛹' 
};

export const INITIAL_FORM_STATE = {
  name: '', species: '', scientificName: '', locality: '', type: 'Kuwagata', gender: 'Unknown', 
  sexDetermined: 'Unknown', status: 'Larva', generation: '', isDigOut: false,
  parentMaleId: '', parentFemaleId: '', hatchDate: '', emergenceDate: '', feedingStartDate: '', 
  deathDate: '', setDate: '', substrate: '', containerSize: '', packingPressure: '', 
  moisture: 3, cohabitation: 'No', archived: false, notes: '', adultSize: '', 
  parentSpawnSetId: '', count: 1, image: null 
};

export const BREEDING_GUIDES = {
  default: "温度: 22-25℃ / 水分: 軽く握って形が崩れない程度 / 詰圧: 底3cmは硬詰め、上部は中詰め / ケース: 中〜大型",
  "Dorcus": "温度: 23-25℃ / マット: 粒子細かめ / 詰圧: 強め / 材: クヌギ・コナラの柔らかめを埋め込み",
  "Dynastes": "温度: 24-26℃ / マット: 完熟・黒枯れ系 / 容器: 15L以上の大型 / 水分: やや多め",
  "hercules lichyi": "温度: 20-23℃ (低温管理が鍵) / マット: 完熟マット / 水分: 標準",
  "オオクワガタ": "温度: 23-25℃ / マット: 粒子細かめ / 詰圧: 強め / 材: クヌギ・コナラ"
};