import React, { useState, useEffect, useMemo } from 'react';
import logoImg from './assets/logo.png'; // 画像をインポート
import { Plus, Trash2, History, Save, X, ChevronRight, Scale, LayoutDashboard, Boxes, Network, ClipboardCheck, Archive, ArrowUpCircle, Sparkles, Thermometer, User, Home, List, Settings, Search, Droplets, Hammer, Calendar, Activity, Bug, Egg, FlaskConical, Ruler, Weight, Edit3, MessageSquare, Download, Upload, RefreshCw, ThermometerSnowflake, Image as ImageIcon, Camera, Ghost, BarChart2, Copy } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

// Gemini APIの初期設定
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const App = () => {
  // 1. データ消失を防止する堅牢な初期化
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('beetle_is_logged_in') === 'true');
  const [userId, setUserId] = useState(() => localStorage.getItem('beetle_user_id') || '');
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [beetles, setBeetles] = useState(() => {
    try {
      const currentId = localStorage.getItem('beetle_user_id');
      if (!currentId) return [];
      const saved = localStorage.getItem(`beetle_pwa_data_${currentId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Data loading error:", e);
    }
    return [];
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedBeetle, setSelectedBeetle] = useState(null);
  const [newWeight, setNewWeight] = useState('');
  const [newTemp, setNewTemp] = useState('');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('beetle_gemini_key') || '');
  const [sbToken, setSbToken] = useState(() => localStorage.getItem('beetle_sb_token') || '');
  const [sbSecret, setSbSecret] = useState(() => localStorage.getItem('beetle_sb_secret') || '');
  const [selectedSbDeviceId, setSelectedSbDeviceId] = useState(() => localStorage.getItem('beetle_sb_device_id') || '');
  const [availableSbDevices, setAvailableSbDevices] = useState(() => { try { return JSON.parse(localStorage.getItem('beetle_sb_devices')) || []; } catch { return []; } });
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('beetle_app_config');
    return saved ? JSON.parse(saved) : {
      labels: {
        Adult: '成虫',
        Larva: '幼虫',
        SpawnSet: '産卵セット',
        Pupa: '蛹'
      }
    };
  });
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'tasks' | 'stats' | 'settings'
  const [view, setView] = useState('list'); // 'list' | 'archive'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'Adult' | 'Larva' | 'SpawnSet' | 'Pupa'
  const [statGraphInfo, setStatGraphInfo] = useState(null); // { title, data, unit, color }
  const [scientificNameSearchTerm, setScientificNameSearchTerm] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [statViewMode, setStatViewMode] = useState('graph'); // 'graph' | 'table'
  const [statSortConfig, setStatSortConfig] = useState({ key: 'value', direction: 'desc' });
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTargets, setBatchTargets] = useState([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState(new Set());

  const initialFormState = {
    name: '', species: '', scientificName: '', locality: '', type: 'Kuwagata', gender: 'Unknown', sexDetermined: 'Unknown', status: 'Larva', generation: 'CB',
    parentMaleId: '', parentFemaleId: '', hatchDate: '', emergenceDate: '', feedingStartDate: '', deathDate: '',
    setDate: '', substrate: '', containerSize: '', packingPressure: '', moisture: 3, cohabitation: 'No', archived: false, notes: '', adultSize: '', parentSpawnSetId: '',
    count: 1, // 一括登録用のカウント
    image: null // 写真用
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isFetchingAI, setIsFetchingAI] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showEmergenceForm, setShowEmergenceForm] = useState(false);
  const [showDeathForm, setShowDeathForm] = useState(false);
  const [isFetchingSb, setIsFetchingSb] = useState(false);
  const [isFetchingSbDevices, setIsFetchingSbDevices] = useState(false);
  const [newLog, setNewLog] = useState({ // Default values for new log entry
    date: new Date().toISOString().split('T')[0], substrate: '', packingPressure: '', moisture: 3, containerSize: '', stage: 'L1', logNotes: ''
  });

  // Save data
  useEffect(() => {
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    // 初期読み込みが完了している場合のみ保存を実行し、空データでの上書きを防止
    if (isDataLoaded && isLoggedIn && userId) {
      localStorage.setItem(`beetle_pwa_data_${userId}`, JSON.stringify(beetles));
    }
  }, [beetles, isDataLoaded, isLoggedIn, userId]);

  useEffect(() => {
    localStorage.setItem('beetle_is_logged_in', isLoggedIn);
  }, [isLoggedIn]);

  // User IDの保存
  useEffect(() => {
    localStorage.setItem('beetle_user_id', userId);
  }, [userId]);

  // APIキーの保存
  useEffect(() => {
    localStorage.setItem('beetle_gemini_key', geminiKey);
  }, [geminiKey]);

  useEffect(() => {
    localStorage.setItem('beetle_sb_token', sbToken);
  }, [sbToken]);

  useEffect(() => {
    localStorage.setItem('beetle_sb_secret', sbSecret);
  }, [sbSecret]);

  // Configの保存
  useEffect(() => {
    localStorage.setItem('beetle_app_config', JSON.stringify(config));
  }, [config]);

  // SwitchBotデバイスIDの保存
  useEffect(() => {
    localStorage.setItem('beetle_sb_device_id', selectedSbDeviceId);
  }, [selectedSbDeviceId]);
  useEffect(() => {
    localStorage.setItem('beetle_sb_devices', JSON.stringify(availableSbDevices));
  }, [availableSbDevices]);

  // 自動バックアップ (1日1回のスナップショット)
  useEffect(() => {
    const lastBackupDate = localStorage.getItem('beetle_last_backup_date');
    const today = new Date().toISOString().split('T')[0];
    
    if (beetles.length > 0 && lastBackupDate !== today) {
      const backupData = {
        beetles,
        config,
        userId,
        backupDate: today
      };
      localStorage.setItem('beetle_auto_backup_data', JSON.stringify(backupData));
      localStorage.setItem('beetle_last_backup_date', today);
      console.log("Auto-backup snapshot created for today.");
    }
  }, [beetles, config, userId]);

  // Web Share API を使用してデータを共有・保存する関数
  const shareData = async () => {
    const data = { beetles, config, userId, exportDate: new Date().toISOString() };
    const fileName = `beetlelog-backup-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'BeetleLog バックアップ',
          text: `${userId}さんの飼育データバックアップです。`,
        });
      } catch (err) {
        if (err.name !== 'AbortError') exportData();
      }
    } else {
      exportData();
    }
  };

  const exportData = () => {
    const data = { beetles, config, userId, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beetlelog-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.beetles && Array.isArray(data.beetles)) {
          if (window.confirm('データを復元しますか？現在のデータはすべて上書きされます。')) {
            setBeetles(data.beetles);
            if (data.config) setConfig(data.config);
            if (data.userId) setUserId(data.userId);
            alert('バックアップから復元しました。');
          }
        }
      } catch (err) { alert('不正なファイル形式です。'); }
    };
    reader.readAsText(file);
  };

  // 個体データをテキスト形式で生成しコピーする関数
  const copyBeetleText = (beetle) => {
    let text = `和名 ${beetle.species || ''}\n`;
    text += `学名 ${beetle.scientificName || ''}\n`;
    text += `産地 ${beetle.locality || ''}\n`;
    text += `累代 ${beetle.generation || ''} ${beetle.name || ''} ${beetle.hatchDate || ''}\n`;

    // 履歴データ（最大5件分）
    for (let i = 0; i < 5; i++) {
      const rec = beetle.records && beetle.records[i];
      if (rec) {
        text += ` ${rec.date || ''} ${rec.substrate || ''} 水${rec.moisture || ''} 圧${rec.packingPressure || ''} ${rec.containerSize || ''} ${rec.stage || ''}\n`;
      } else {
        text += `\n`;
      }
    }

    const emergenceDateFormatted = beetle.emergenceDate ? beetle.emergenceDate : '　　　　　　　　　'; // 全角スペース10個
    const feedingStartDateFormatted = beetle.feedingStartDate ? beetle.feedingStartDate : '　　　　　　　　　'; // 全角スペース10個

    text += `\n　　　${emergenceDateFormatted} 羽化・堀　${feedingStartDateFormatted} 後食`;

    if (!navigator.clipboard) {
      alert('このブラウザではクリップボードへのコピーがサポートされていません。');
      return;
    }

    navigator.clipboard.writeText(text)
      .then(() => alert('個体データをテキスト形式でコピーしました。'))
      .catch(err => alert('コピーに失敗しました: ' + err));
  };

  // Geminiを使用して学名を取得する関数
  const fetchScientificName = async (speciesName) => {
    // 設定画面のキーを最優先、なければ環境変数のキーを使用（空白除去）
    const activeKey = (geminiKey && geminiKey.trim() !== '') ? geminiKey.trim() : apiKey?.trim();
    
    if (!speciesName) return alert("種類名（和名）を入力してから実行してください。");
    
    if (!activeKey) {
      return alert("Gemini APIキーが設定されていません。設定タブでキーを入力してください。");
    }

    setIsFetchingAI(true);
    try {
      const dynamicAI = new GoogleGenerativeAI(activeKey);
      const model = dynamicAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });
      const prompt = `Return ONLY the scientific name in Latin for the beetle "${speciesName}". No commentary, no bold text, just the name. If unknown, return "Unknown".`;
      const result = await model.generateContent(prompt);
      // 不要な記号（バッククォートなど）を除去
      const response = await result.response;
      const text = response.text().replace(/[`*]/g, "").trim();
      
      if (text === "Unknown" || text === "") {
        alert("該当する学名が見つかりませんでした。");
      } else {
        setFormData(prev => ({ ...prev, scientificName: text }));
      }
    } catch (error) {
      alert(`Gemini APIエラー: ${error.message || "通信に失敗しました。キーが有効か確認してください。"}`);
    } finally {
      setIsFetchingAI(false);
    }
  };

  // 画像の読み込み処理
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // SwitchBot API認証ヘッダー生成
  const getSwitchBotHeaders = async (token, secret) => {
    const t = Date.now().toString();
    const nonce = crypto.randomUUID();
    const data = token + t + nonce;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const sign = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return { "Authorization": token, "sign": sign, "nonce": nonce, "t": t, "Content-Type": "application/json; charset=utf8" };
  };

  // SwitchBot APIから温度を取得する関数
  const fetchSbTemperature = async () => {
    if (!sbToken || !sbSecret) return alert("SwitchBotのトークンとシークレットを設定画面で入力してください。");
    if (!selectedSbDeviceId) return alert("SwitchBotデバイスが選択されていません。設定画面で選択してください。");

    setIsFetchingSb(true);
    try {
      const headers = await getSwitchBotHeaders(sbToken, sbSecret);

      // 状態（温度）の取得
      const statusRes = await fetch(`https://api.switch-bot.com/v1.1/devices/${selectedSbDeviceId}/status`, { headers });
      const statusData = await statusRes.json();

      if (statusData.statusCode === 100) {
        setNewTemp(statusData.body.temperature.toString());
      } else {
        throw new Error(statusData.message);
      }
    } catch (error) {
      console.error("SwitchBot Error:", error);
      alert("SwitchBotからのデータ取得に失敗しました。CORS制限やキーの設定を確認してください。");
    } finally {
      setIsFetchingSb(false);
    }
  };

  // SwitchBotデバイスリストを取得する関数
  const fetchSbDevices = async () => {
    if (!sbToken || !sbSecret) return alert("SwitchBotのトークンとシークレットを設定画面で入力してください。");

    setIsFetchingSbDevices(true);
    try {
      const headers = await getSwitchBotHeaders(sbToken, sbSecret);
      const devRes = await fetch("https://api.switch-bot.com/v1.1/devices", { headers });
      const devData = await devRes.json();

      if (devData.statusCode === 100) {
        const meters = devData.body.deviceList.filter(d => 
          d.deviceType.includes("Meter") || d.deviceType.includes("SensorTH")
        );
        setAvailableSbDevices(meters);
        // 以前選択されていたデバイスがリストにあればそれを選択、なければ最初のデバイスを選択
        if (meters.length > 0) {
          if (!selectedSbDeviceId || !meters.some(m => m.deviceId === selectedSbDeviceId)) {
            setSelectedSbDeviceId(meters[0].deviceId);
          }
        } else {
          setSelectedSbDeviceId('');
        }
      } else {
        throw new Error(devData.message);
      }
    } catch (error) {
      console.error("SwitchBot Devices Error:", error);
      alert("SwitchBotデバイスリストの取得に失敗しました。CORS制限やキーの設定を確認してください。");
    }
  };

  const handleAddBeetle = () => {
    if (!formData.name) return alert('管理名を入力してください');
    
    if (isEditing) {
      const updated = beetles.map(b => b.id === formData.id ? { ...formData } : b);
      setBeetles(updated);
      setSelectedBeetle(formData);
      setIsEditing(false);
    } else {
      // 一括登録のロジック
      const newEntries = [];
      const count = parseInt(formData.count) || 1;
      const baseName = formData.name;

      for (let i = 0; i < count; i++) {
        newEntries.push({
          ...formData,
          name: count > 1 ? `${baseName}-${String(i + 1).padStart(2, '0')}` : baseName,
          id: `${Date.now()}-${i}`,
          records: [],
          tasks: formData.status === 'Larva' ? [{ id: Date.now() + i, type: '菌糸/マット交換', date: '', completed: false }] : []
        });
      }
      setBeetles([...newEntries, ...beetles]);
    }
    
    setShowForm(false);
    setFormData(initialFormState);
  };

  const openFormWithStatus = (status) => {
    setFormData({
      ...initialFormState,
      status: status
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEmergenceSubmit = () => {
    if (!formData.emergenceDate) return alert('羽化日を入力してください');
    const updatedBeetles = beetles.map(b => {
      if (b.id === formData.id) {
        return {
          ...b,
          status: 'Adult',
          emergenceDate: formData.emergenceDate,
          feedingStartDate: formData.feedingStartDate,
          gender: formData.gender,
          adultSize: formData.adultSize,
          archived: false, // 羽化したらアーカイブ解除
        };
      }
      return b;
    });
    setBeetles(updatedBeetles);
    setShowEmergenceForm(false);
    setSelectedBeetle(null); // 詳細画面を閉じる
    setFormData(initialFormState);
  };

  const handleDeathSubmit = () => {
    if (!formData.deathDate) return alert('死亡日を入力してください');
    const updatedBeetles = beetles.map(b => b.id === formData.id ? { ...b, deathDate: formData.deathDate, archived: true } : b);
    setBeetles(updatedBeetles);
    setShowDeathForm(false);
    setSelectedBeetle(null); // 詳細画面を閉じる
    setFormData(initialFormState);
  };


  const startEditBeetle = (beetle) => {
    setFormData({ ...beetle });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleEmerge = (id) => {
    setBeetles(beetles.map(b => b.id === id ? { ...b, status: 'Adult', emergenceDate: new Date().toLocaleDateString() } : b));
    if (selectedBeetle?.id === id) setSelectedBeetle({ ...selectedBeetle, status: 'Adult' });
  };

  const toggleArchive = (id) => {
    setBeetles(beetles.map(b => b.id === id ? { ...b, archived: !b.archived } : b));
    setSelectedBeetle(null);
  };

  const handleBatchRecordSubmit = () => {
    if (selectedBatchIds.size === 0) return alert('対象が選択されていません');
    
    const updated = beetles.map(b => {
      if (selectedBatchIds.has(b.id)) {
        const newRecord = { 
          date: newLog.date || new Date().toLocaleDateString(), 
          weight: newWeight !== '' ? parseFloat(newWeight) : null, 
          temperature: newTemp !== '' ? parseFloat(newTemp) : null, 
          id: Date.now() + Math.random(),
          ...newLog
        };
        return { ...b, records: [...b.records, newRecord] };
      }
      return b;
    });
    setBeetles(updated);
    setShowBatchModal(false);
    alert(`${selectedBatchIds.size}頭の一括記録を完了しました。`);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!userId.trim()) return alert('ユーザーIDを入力してください');
    
    // ユーザー別のデータをロード
    const saved = localStorage.getItem(`beetle_pwa_data_${userId}`);
    if (saved) {
      setBeetles(JSON.parse(saved));
    } else {
      setBeetles([]);
    }
    
    setIsLoggedIn(true);
    setIsDataLoaded(true); // ログイン時にデータロード完了とする
  };

  const handleLogout = () => {
    if (window.confirm('ログアウトしますか？（データはブラウザに保存されたままになります）')) {
      setIsLoggedIn(false);
      setSelectedBeetle(null);
    }
  };

  const toggleBatchSelection = (id) => {
    const newSet = new Set(selectedBatchIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedBatchIds(newSet);
  };

  const revertStatus = (beetle) => {
    if (!window.confirm('処理を前の段階に戻しますか？入力された日付やサイズ情報はクリアされます。')) return;
    const updatedBeetles = beetles.map(b => {
      if (b.id === beetle.id) {
        let updated = { ...b };
        if (updated.deathDate) {
          updated.deathDate = '';
          updated.archived = false;
        } else if (updated.status === 'Adult') {
          updated.status = 'Larva';
          updated.emergenceDate = '';
          updated.feedingStartDate = '';
          updated.adultSize = '';
        }
        return updated;
      }
      return b;
    });
    setBeetles(updatedBeetles);
    setSelectedBeetle(updatedBeetles.find(b => b.id === beetle.id));
  };

  const toggleTask = (beetleId, taskId) => {
    setBeetles(beetles.map(b => {
      if (b.id === beetleId) {
        return {
          ...b,
          tasks: (b.tasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return b;
    }));
  };

  // 自動タスク（期限切れアラート）の取得
  const getAutoTasks = (beetle) => {
    const autoTasks = [];
    if (beetle.archived) return autoTasks;

    const now = new Date();

    if (beetle.status === 'Larva') {
      const lastRecordDate = beetle.records.length > 0 
        ? new Date(beetle.records[beetle.records.length - 1].date)
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

  // 学名ごとの統計データを計算
  const getScientificNameStats = () => {
    const grouped = beetles.reduce((acc, b) => {
      const name = b.scientificName || '学名未設定';
      if (!acc[name]) {
        acc[name] = {
          name,
          speciesNames: new Set(),
          count: 0,
          larvalPeriods: [],
          restingPeriods: [],
          sizes: [],
          temps: [],
          substrates: new Set(),
          spawnSetData: [], // { name, value }
          spawnSetIds: [] 
        };
      }
      
      acc[name].count++;
      if (b.species) acc[name].speciesNames.add(b.species);
      
      // 幼虫期間 (hatch -> emergence)
      if (b.hatchDate && b.emergenceDate) {
        const start = new Date(b.hatchDate);
        const end = new Date(b.emergenceDate);
        if (!isNaN(start) && !isNaN(end)) {
          acc[name].larvalPeriods.push({ name: b.name, value: Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) });
        }
      }
      
      // 休眠期間 (emergence -> feeding)
      if (b.emergenceDate && b.feedingStartDate) {
        const start = new Date(b.emergenceDate);
        const end = new Date(b.feedingStartDate);
        if (!isNaN(start) && !isNaN(end)) {
          acc[name].restingPeriods.push({ name: b.name, value: Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) });
        }
      }

      if (b.adultSize) acc[name].sizes.push({ name: b.name, value: parseFloat(b.adultSize) });

      // 温度とマットの履歴
      b.records.forEach(r => {
        if (r.temperature) acc[name].temps.push(parseFloat(r.temperature));
        if (r.substrate) acc[name].substrates.add(r.substrate);
      });

      // 産卵セットIDを保持
      if (b.status === 'SpawnSet') acc[name].spawnSetIds.push(b.id);

      return acc;
    }, {});

    const filteredGroups = Object.values(grouped).filter(group => 
      group.name.toLowerCase().includes(scientificNameSearchTerm.toLowerCase())
    );

    // 産卵データの構築と環境データの紐付け
    filteredGroups.forEach(group => {
        group.spawnSetIds.forEach(setId => {
            const setName = beetles.find(b => b.id === setId)?.name || 'Unknown Set';
            const count = beetles.filter(b => b.parentSpawnSetId === setId).length;
            const beetle = beetles.find(b => b.id === setId);
            
            // 産卵セットの環境データ取得
            group.spawnSetData.push({ 
              name: setName, 
              value: count,
              temp: beetle ? getStatSummary(beetle.records.map(r => ({value: r.temperature}))).avg : '-',
              moisture: beetle ? beetle.moisture : '-',
              packing: beetle ? beetle.packingPressure : '-',
              id: setId
            });
        });
    });

    return filteredGroups.sort((a, b) => b.count - a.count);
  };

  // 学名データの収集ロジックを微調整 (IDを含める)
  const enhancedStats = useMemo(() => {
    const stats = getScientificNameStats() || [];
    return stats.map(group => {
      const updatedGroup = { ...group };
      ['sizes', 'larvalPeriods', 'restingPeriods'].forEach(key => {
        updatedGroup[key] = (updatedGroup[key] || []).map(item => {
          const beetle = beetles.find(b => b.name === item.name);
          if (!beetle) return item;

          const avgTemp = getStatSummary((beetle.records || []).map(r => ({ value: r.temperature }))).avg;
          const lastRec = beetle.records.length > 0 ? beetle.records[beetle.records.length - 1] : {};

          return {
            ...item,
            temp: avgTemp,
            moisture: beetle.status === 'SpawnSet' ? (beetle.moisture || '-') : (lastRec.moisture || '-'),
            packing: beetle.status === 'SpawnSet' ? (beetle.packingPressure || '-') : (lastRec.packingPressure || '-')
          };
        });
      });
      return updatedGroup;
    });
  }, [beetles, scientificNameSearchTerm]);

  const getEnhancedStats = () => enhancedStats;

  const getStatSummary = (arr) => {
    if (!arr || !arr.length) return { avg: '-', min: '-', max: '-' };
    const values = arr.map(item => item.value);
    return {
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      min: Math.min(...values).toFixed(1),
      max: Math.max(...values).toFixed(1)
    };
  };

  // 羽化までの日数計算
  const calculateDaysToEmergence = (beetle) => {
    const start = beetle.hatchDate ? new Date(beetle.hatchDate) : new Date(parseInt(beetle.id));
    const end = beetle.emergenceDate ? new Date(beetle.emergenceDate) : null;
    if (!end) return null;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Stats
  const stats = {
    adults: beetles.filter(b => b.status === 'Adult' && !b.archived).length,
    larvae: beetles.filter(b => b.status === 'Larva' && !b.archived).length,
    spawnSets: beetles.filter(b => b.status === 'SpawnSet' && !b.archived).length,
    pendingTasks: beetles.reduce((acc, b) => {
      const manual = b.tasks?.filter(t => !t.completed).length || 0;
      const auto = getAutoTasks(b).length;
      return acc + manual + auto;
    }, 0)
  };

  const categories = { Adults: config.labels.Adult, Larvae: config.labels.Larva, SpawnSets: config.labels.SpawnSet, Pupas: config.labels.Pupa };

  // 重複を除いた既存の管理名と種類のリストを作成
  const existingNames = [...new Set(beetles.map(b => b.name))].filter(Boolean);
  const existingSpecies = [...new Set(beetles.map(b => b.species))].filter(Boolean);
  const existingLocalities = [...new Set(beetles.map(b => b.locality))].filter(Boolean);
  const existingGenerations = [...new Set(beetles.map(b => b.generation))].filter(Boolean);
  const existingSubstrates = [...new Set([
    ...beetles.map(b => b.substrate),
    ...beetles.flatMap(b => b.records?.map(r => r.substrate) || [])
  ])].filter(Boolean);
  const existingContainers = [...new Set([
    ...beetles.map(b => b.containerSize),
    ...beetles.flatMap(b => b.records?.map(r => r.containerSize) || [])
  ])].filter(Boolean);

  const getEnhancedStats = () => enhancedStats;


  const deleteBeetle = (id, e) => {
    e.stopPropagation();
    if (window.confirm('この個体を削除してもよろしいですか？')) {
      setBeetles(beetles.filter(b => b.id !== id));
      if (selectedBeetle?.id === id) setSelectedBeetle(null);
    }
  };

  const deleteRecord = (beetleId, recordId) => {
    if (!window.confirm('この記録を削除してもよろしいですか？')) return;
    const updated = beetles.map(b => {
      if (b.id === beetleId) {
        const updatedRecords = b.records.filter(r => r.id !== recordId);
        if (selectedBeetle?.id === beetleId) setSelectedBeetle({ ...b, records: updatedRecords });
        return { ...b, records: updatedRecords };
      }
      return b;
    });
    setBeetles(updated);
  };

  const handleUpdateRecord = (beetleId) => {
    const updated = beetles.map(b => {
      if (b.id === beetleId) {
        const updatedRecords = b.records.map(r => r.id === editingRecord.id ? { ...editingRecord, weight: editingRecord.weight === '' ? null : parseFloat(editingRecord.weight), temperature: editingRecord.temperature === '' ? null : parseFloat(editingRecord.temperature) } : r);
        const updatedBeetle = { ...b, records: updatedRecords };
        setSelectedBeetle(updatedBeetle);
        return updatedBeetle;
      }
      return b;
    });
    setBeetles(updated);
    setEditingRecord(null);
  };

  const addRecord = (id) => {
    const weightValue = newWeight !== '' ? parseFloat(newWeight) : null; // Allow null for weight
    const tempValue = newTemp !== '' ? parseFloat(newTemp) : null; // Allow null for temperature

    const updated = beetles.map(b => {
      if (b.id === id) {
        const newRecord = { 
          date: newLog.date || new Date().toLocaleDateString(), 
          weight: weightValue, 
          temperature: tempValue, 
          id: Date.now(),
          ...newLog
        };
        const updatedBeetle = { ...b, records: [...b.records, newRecord] };
        setSelectedBeetle(updatedBeetle); // 詳細表示を更新
        return updatedBeetle;
      }
      return b;
    });
    setBeetles(updated);
    setNewWeight('');
    setNewTemp('');
    setNewLog({ date: new Date().toISOString().split('T')[0], substrate: '', packingPressure: '', moisture: 3, containerSize: '', stage: 'L1', logNotes: '' }); // Reset newLog state
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between border-b border-slate-50 py-2">
      <span className="text-xs font-bold text-slate-400 uppercase">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value || '-'}</span>
    </div>
  );

  const RatingSelector = ({ label, value, onChange, icon: Icon }) => (
    <div className="flex flex-col gap-1 mt-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Icon size={12}/> {label}</label>
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <button key={num} onClick={() => onChange(num)} className={`flex-1 py-1 rounded-md text-xs font-bold transition-all ${value === num ? 'bg-emerald-600 text-white shadow-inner' : 'bg-slate-100 text-slate-400'}`}>{num}</button>
        ))}
      </div>
    </div>
  );

  const renderLineage = (beetle) => {
    const maleParent = beetles.find(b => b.id === beetle.parentMaleId);
    const femaleParent = beetles.find(b => b.id === beetle.parentFemaleId);
    return (
      <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
        <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2">Lineage (家系)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm">
            <span className="text-gray-500 block">♂ Parent:</span>
            {maleParent ? maleParent.name : beetle.parentMaleId || '未登録'}
          </div>
          <div className="text-sm">
            <span className="text-gray-500 block">♀ Parent:</span>
            {femaleParent ? femaleParent.name : beetle.parentFemaleId || '未登録'}
          </div>
        </div>
      </div>
    );
  };

  // ログイン画面のコンポーネント
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-8">
            <img src={logoImg} alt="BeetleLog" className="w-24 h-24 object-contain mb-4" />
            <h1 className="text-3xl font-black text-emerald-800">BeetleLog</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Management System</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ユーザーID (識別名)</label>
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <User size={20} className="text-emerald-700" />
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="IDを入力..."
                  className="text-sm font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all">ログイン</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 pb-32 font-sans">
        {/* Header */}
        <header className="bg-white text-emerald-900 border-b border-slate-200 p-4 sticky top-0 z-10">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <h1 
              onClick={() => setActiveTab('home')} 
              className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-emerald-800 cursor-pointer select-none active:opacity-70 transition-opacity"
            >
              <img src={logoImg} alt="BeetleLog" className="w-10 h-10 rounded-xl object-contain shadow-sm" />
              BeetleLog
            </h1>
            <div className="flex gap-1">
              <button onClick={() => openFormWithStatus('Adult')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl" title="成虫登録"><Bug size={24} /></button>
              <button onClick={() => openFormWithStatus('Larva')} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl" title="幼虫登録"><Activity size={24} /></button>
              <button onClick={() => openFormWithStatus('SpawnSet')} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl" title="セット登録"><Egg size={24} /></button>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto p-4">
          {/* Removed top dashboard card */}

          {/* Tab: Home */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* 検索中またはカテゴリ選択時は、結果に集中させるためタスクセクションを非表示にする */}
              {!searchTerm && filterStatus === 'All' && (
                <div className="mb-8">
                  <h3 className="font-bold text-slate-700 mb-3 px-1">最近のタスク</h3>
                  <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
                    {beetles.filter(b => !b.archived && (b.tasks?.some(t => !t.completed) || getAutoTasks(b).length > 0)).length > 0 ? (
                      beetles.filter(b => !b.archived && (b.tasks?.some(t => !t.completed) || getAutoTasks(b).length > 0))
                        .slice(0, 3)
                        .map(b => {
                          const firstTask = (b.tasks || []).find(t => !t.completed) || getAutoTasks(b)[0];
                          return (
                            <div 
                              key={b.id} 
                              onClick={() => setSelectedBeetle(b)}
                              className="p-3 border-b last:border-0 border-slate-50 flex justify-between items-center active:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${firstTask.isAuto ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                  <ClipboardCheck size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{b.name}</p>
                                  <p className={`text-xs ${firstTask.isAuto ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>{firstTask.type}</p>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-slate-300" />
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">予定されたタスクはありません</p>
                    )}
                  </div>
                </div>
              )}

              {/* Integrated List Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700">個体リスト</h3>
                    {filterStatus !== 'All' && (
                      <button onClick={() => setFilterStatus('All')} className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">クリア</button>
                    )}
                  </div>
                  <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg">
                    <button onClick={() => setView('list')} className={`px-3 py-1 text-xs rounded-md transition-all ${view === 'list' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-500'}`}>飼育中</button>
                    <button onClick={() => setView('archive')} className={`px-3 py-1 text-xs rounded-md transition-all ${view === 'archive' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-500'}`}>終了</button>
                  </div>
                </div>

                {filterStatus === 'Larva' && !view.includes('archive') && (
                  <button 
                    onClick={() => {
                      const targets = beetles.filter(b => b.status === 'Larva' && !b.archived);
                      if (targets.length === 0) return alert('記録可能な幼虫がいません');
                      // 全ての幼虫を対象にするか、検索結果に合わせるか選べる
                      setBatchTargets(targets);
                      setSelectedBatchIds(new Set(targets.map(t => t.id)));
                      setShowBatchModal(true);
                    }}
                    className="w-full bg-emerald-800 text-white py-3 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    <RefreshCw size={14}/> 全ての幼虫を一括で交換記録
                  </button>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="全項目で検索..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-3 pb-24">
                  {(() => {
                    const filtered = beetles
                      .filter(b => view === 'archive' ? b.archived : !b.archived)
                      .filter(b => filterStatus === 'All' || b.status === filterStatus)
                      .filter(b => {
                        const term = searchTerm.toLowerCase();
                        if (!term) return true;
                        const searchableValues = [b.name, b.species, b.locality, b.generation, b.substrate, b.notes];
                        return searchableValues.some(val => val && String(val).toLowerCase().includes(term));
                      });

                    if (filtered.length === 0 && (searchTerm || filterStatus !== 'All')) {
                      return (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                          <Search className="mx-auto text-slate-200 mb-2" size={40} />
                          <p className="text-sm text-slate-400 font-bold">該当する個体がいません</p>
                        </div>
                      );
                    }

                    return filtered.map(beetle => {
                      const lastRecordDate = beetle.records.length > 0 
                        ? new Date(beetle.records[beetle.records.length - 1].date)
                        : (beetle.hatchDate ? new Date(beetle.hatchDate) : (beetle.setDate ? new Date(beetle.setDate) : new Date(parseInt(beetle.id))));
                      
                      const overdueLimit = new Date(lastRecordDate);
                      overdueLimit.setMonth(overdueLimit.getMonth() + 3);
                      const isOverdue = !beetle.archived && new Date() > overdueLimit;

                      return (
                      <div 
                        key={beetle.id} 
                        onClick={() => setSelectedBeetle(beetle)}
                        className={`p-4 rounded-2xl shadow-sm border flex justify-between items-center active:scale-[0.98] transition-all ${isOverdue ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-100'}`}
                      >
                      <div className="flex gap-3 items-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl overflow-hidden shadow-inner ${!beetle.image && (beetle.status === 'Larva' ? 'bg-amber-50 text-amber-600' : beetle.status === 'SpawnSet' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')}`}>
                          {beetle.image ? (
                            <img src={beetle.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            beetle.status === 'Larva' ? '🐛' : beetle.status === 'SpawnSet' ? '🥚' : '✨'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{beetle.name}</span>
                            {isOverdue && <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">要交換</span>}
                          </div>
                          <p className="text-xs text-slate-500 font-bold leading-tight">{beetle.species}</p>
                          <p className="text-[10px] text-slate-400 italic leading-tight">{beetle.scientificName}</p>
                        </div>
                      </div>
                      <ChevronRight className={isOverdue ? "text-rose-400" : "text-slate-300"} size={18} />
                    </div>
                    );
                  });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Tasks (Full View) */}
          {activeTab === 'tasks' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              <h3 className="font-bold text-slate-700 px-1">全タスク一覧</h3>
              <div className="space-y-3">
                {beetles.filter(b => !b.archived && (b.tasks?.some(t => !t.completed) || getAutoTasks(b).length > 0)).map(b => (
                  <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-800">{b.name}</span>
                      <button onClick={() => setSelectedBeetle(b)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">詳細を見る</button>
                    </div>
                    <div className="space-y-2">
                      {(b.tasks || []).filter(t => !t.completed).map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <input type="checkbox" checked={task.completed} onChange={() => toggleTask(b.id, task.id)} className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-700">{task.type}</p>
                            <p className="text-[10px] text-slate-400">{task.date || '期限未設定'}</p>
                          </div>
                        </div>
                      ))}
                      {getAutoTasks(b).map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                          <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white">
                            <History size={12} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-rose-700">{task.type}</p>
                            <p className="text-[10px] text-rose-400">自動生成アラート</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Stats (Scientific Name Aggregation) */}
          {activeTab === 'stats' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              <h2 className="text-xl font-bold text-slate-800 px-1">系統・学名別統計</h2>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="学名で検索..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                  value={scientificNameSearchTerm}
                  onChange={(e) => setScientificNameSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-1 pb-10">
                {getEnhancedStats().map(group => {
                  const sizeSum = getStatSummary(group.sizes);
                  const offspringSum = getStatSummary(group.spawnSetData);
                  const larvalSum = getStatSummary(group.larvalPeriods);
                  const restingSum = getStatSummary(group.restingPeriods);
                  const isExpanded = expandedGroup === group.name;

                  return (
                    <div key={group.name} className="bg-white border-b border-slate-100 overflow-hidden transition-all">
                      <button 
                        onClick={() => setExpandedGroup(isExpanded ? null : group.name)}
                        className="w-full px-5 py-3.5 flex justify-between items-center text-left active:bg-slate-50"
                      >
                        <span className="text-sm font-bold text-emerald-900 uppercase tracking-tight">{group.name}</span>
                        <ChevronRight className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={18} />
                      </button>
                      
                      {isExpanded && (
                        <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-[10px] font-bold text-slate-400 mb-3 border-b border-slate-50 pb-1">{Array.from(group.speciesNames).join(' / ') || '種名未設定'}</p>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <button 
                              onClick={() => { setStatGraphInfo({ title: `${group.name} - サイズ比較`, data: group.sizes, unit: 'mm', color: '#10b981' }); setStatViewMode('graph'); }}
                              className="bg-emerald-50 p-3 rounded-xl text-left"
                            >
                              <p className="text-[9px] font-bold text-emerald-600 uppercase">サイズ</p>
                              <p className="text-base font-black text-emerald-700">{sizeSum.avg}mm</p>
                            </button>
                            <button 
                              onClick={() => { setStatGraphInfo({ title: `${group.name} - 割り出し数比較`, data: group.spawnSetData, unit: '頭', color: '#f43f5e' }); setStatViewMode('graph'); }}
                              className="bg-rose-50 p-3 rounded-xl text-left"
                            >
                              <p className="text-[9px] font-bold text-rose-600 uppercase">割り出し</p>
                              <p className="text-base font-black text-rose-700">{group.spawnSetData.reduce((a,b)=>a+b.value, 0)}頭</p>
                            </button>
                            <button 
                              onClick={() => { setStatGraphInfo({ title: `${group.name} - 幼虫期間比較`, data: group.larvalPeriods, unit: '日', color: '#f59e0b' }); setStatViewMode('graph'); }}
                              className="bg-amber-50 p-3 rounded-xl text-left"
                            >
                              <p className="text-[9px] font-bold text-amber-600 uppercase">幼虫期間</p>
                              <p className="text-base font-black text-amber-700">{larvalSum.avg}日</p>
                            </button>
                            <button 
                              onClick={() => { setStatGraphInfo({ title: `${group.name} - 休眠期間比較`, data: group.restingPeriods, unit: '日', color: '#3b82f6' }); setStatViewMode('graph'); }}
                              className="bg-blue-50 p-3 rounded-xl text-left"
                            >
                              <p className="text-[9px] font-bold text-blue-600 uppercase">休眠期間</p>
                              <p className="text-base font-black text-blue-700">{restingSum.avg}日</p>
                            </button>
                          </div>

                          <button 
                            onClick={() => {
                              const targets = beetles.filter(b => b.scientificName === group.name && b.status === 'Larva' && !b.archived);
                              if (targets.length === 0) return alert('記録可能な幼虫がいません');
                              setBatchTargets(targets);
                              setSelectedBatchIds(new Set(targets.map(t => t.id)));
                              setShowBatchModal(true);
                            }}
                            className="w-full bg-emerald-900 text-white py-3.5 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
                          >
                            <RefreshCw size={14}/> この系統の幼虫を一括で交換記録
                          </button>

                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Thermometer size={12}/> 平均温度: {getStatSummary(group.temps).avg}℃</p>
                            <div className="flex gap-1">
                              {Array.from(group.substrates).slice(0,2).map(s => <span key={s} className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">{s}</span>)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">設定</h2>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">ブリーダー名</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">
                    <User size={18} className="text-emerald-700" />
                    <input
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="text-sm font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">構成ラベル編集 (スマホで変更可)</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(config.labels).map(([key, label]) => (
                      <div key={key} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold mb-1">{key}</p>
                        <input
                          value={label}
                          onChange={(e) => setConfig({
                            ...config,
                            labels: { ...config.labels, [key]: e.target.value }
                          })}
                          className="text-xs font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">API設定</label>
                  <div className="space-y-3 mt-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1 italic">Gemini API Key (Google AI)</p>
                      <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="text-xs font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                        placeholder="AIza..."
                      />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">SwitchBot API Token</p>
                      <input
                        type="password"
                        value={sbToken}
                        onChange={(e) => setSbToken(e.target.value)}
                        className="text-xs font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                        placeholder="Token..."
                      />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">SwitchBot Client Secret</p>
                      <input
                        type="password"
                        value={sbSecret}
                        onChange={(e) => setSbSecret(e.target.value)}
                        className="text-xs font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                        placeholder="Secret..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">SwitchBotデバイス設定</label>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">温湿度計の選択</p>
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedSbDeviceId}
                        onChange={(e) => setSelectedSbDeviceId(e.target.value)}
                        className="flex-1 text-xs font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                        disabled={isFetchingSbDevices}
                      >
                        <option value="">デバイスを選択してください</option>
                        {availableSbDevices.map(device => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.deviceName} ({device.deviceType})
                          </option>
                        ))}
                      </select>
                      <button onClick={fetchSbDevices} className={`p-1.5 rounded-lg transition-colors ${isFetchingSbDevices ? "text-emerald-500 animate-spin" : "text-slate-400 hover:text-emerald-600"}`} title="デバイスリストを更新">
                        <RefreshCw size={18} />
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 px-1">
                      ※ APIキーはブラウザにのみ保存されます。
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50 space-y-1">
                  <button onClick={shareData} className="w-full text-left p-2 text-sm text-slate-600 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <MessageSquare size={18} className="text-emerald-600" />
                      <span>バックアップを共有・保存 (JSON)</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </button>
                  
                  <label className="w-full text-left p-2 text-sm text-slate-600 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Upload size={18} className="text-blue-600" />
                      <span>バックアップを読み込む</span>
                    </div>
                    <input type="file" accept=".json" onChange={importData} className="hidden" />
                  </label>

                  <button 
                    onClick={() => {
                      const saved = localStorage.getItem('beetle_auto_backup_data');
                      if (!saved) return alert('自動バックアップがまだ作成されていません。');
                      const data = JSON.parse(saved);
                      if (window.confirm(`${data.backupDate} の自動バックアップから復元しますか？`)) {
                        setBeetles(data.beetles);
                        if (data.config) setConfig(data.config);
                        alert('復元が完了しました。');
                      }
                    }}
                    className="w-full text-left p-2 text-sm text-slate-600 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw size={18} className="text-amber-500" />
                      <span>昨日の状態に復元 (自動スナップショット)</span>
                    </div>
                  </button>

                  <button onClick={() => window.confirm('全データを削除しますか？') && setBeetles([])} className="w-full text-left p-2 text-sm text-rose-500 flex items-center justify-between hover:bg-rose-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <Trash2 size={18} />
                      <span>全データの初期化</span>
                    </div>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-50">
                  <button onClick={handleLogout} className="w-full text-left p-2 text-sm text-rose-600 flex items-center justify-between hover:bg-rose-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <X size={18} />
                      <span className="font-bold">ログアウト</span>
                    </div>
                  </button>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">BeetleLog Official Release v1.0.0</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Floating Action Button */}
        <button 
          onClick={() => setShowForm(true)}
          className="fixed bottom-28 right-6 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center active:scale-90 transition-all z-20"
        >
          <Plus size={40} />
        </button>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <nav className="bg-white/90 backdrop-blur-lg border-t border-slate-100 px-6 py-4 pb-10 flex justify-between items-center shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
            <button onClick={() => { setActiveTab('home'); setFilterStatus('All'); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' && filterStatus === 'All' ? 'text-emerald-700 scale-110' : 'text-slate-400'}`}>
              <Home size={26} fill={activeTab === 'home' && filterStatus === 'All' ? "currentColor" : "none"} />
              <span className="text-xs font-bold">ホーム</span>
            </button>

            {/* 個体数統計・フィルターボタン群 */}
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl gap-1 border border-slate-200/50">
              <button onClick={() => { setActiveTab('home'); setFilterStatus(filterStatus === 'Adult' ? 'All' : 'Adult'); }} className={`flex flex-col items-center px-4 py-1.5 rounded-xl transition-all ${filterStatus === 'Adult' && activeTab === 'home' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}>
                <span className="text-[9px] font-bold leading-tight">成虫</span>
                <span className="text-sm font-black">{stats.adults}</span>
              </button>
              <button onClick={() => { setActiveTab('home'); setFilterStatus(filterStatus === 'Larva' ? 'All' : 'Larva'); }} className={`flex flex-col items-center px-4 py-1.5 rounded-xl transition-all ${filterStatus === 'Larva' && activeTab === 'home' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}>
                <span className="text-[9px] font-bold leading-tight">幼虫</span>
                <span className="text-sm font-black">{stats.larvae}</span>
              </button>
              <button onClick={() => { setActiveTab('home'); setFilterStatus(filterStatus === 'SpawnSet' ? 'All' : 'SpawnSet'); }} className={`flex flex-col items-center px-4 py-1.5 rounded-xl transition-all ${filterStatus === 'SpawnSet' && activeTab === 'home' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'}`}>
                <span className="text-[9px] font-bold leading-tight">セット</span>
                <span className="text-sm font-black">{stats.spawnSets}</span>
              </button>
              <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center px-4 py-1.5 rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}>
                <span className="text-[9px] font-bold leading-tight">タスク</span>
                <span className="text-sm font-black">{stats.pendingTasks}</span>
              </button>
            </div>

            <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'stats' ? 'text-emerald-700 scale-110' : 'text-slate-400'}`}>
              <BarChart2 size={26} />
              <span className="text-xs font-bold">分析</span>
            </button>

            <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'settings' ? 'text-emerald-700 scale-110' : 'text-slate-400'}`}>
              <Settings size={26} />
              <span className="text-xs font-bold">設定</span>
            </button>
          </nav>
        </div>

        {/* Detail Modal */}
        {selectedBeetle && (
          <div className="fixed inset-0 bg-white z-20 flex flex-col">
            <div className="bg-emerald-800 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{(categories[selectedBeetle.status + 's'] || '個体')}詳細</h2>
              <button onClick={() => setSelectedBeetle(null)}><X size={24} /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="bg-white p-5 rounded-2xl mb-4 relative shadow-sm border border-slate-100">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-2xl font-black text-slate-800">{selectedBeetle.name}</h3>
                  <p className="text-sm font-bold text-emerald-600">{selectedBeetle.species}</p>
                  <p className="text-xs italic text-slate-400">{selectedBeetle.scientificName}</p>
                </div>
                
                <div className="space-y-1">
                  <InfoRow label="産地" value={selectedBeetle.locality} />
                  <InfoRow label="累代" value={selectedBeetle.generation} />
                  <InfoRow label="性別" value={selectedBeetle.gender === 'Male' ? 'オス ♂' : selectedBeetle.gender === 'Female' ? 'メス ♀' : '不明'} />
                  <InfoRow label="状態" value={categories[selectedBeetle.status + 's'] || selectedBeetle.status} />

                  {/* 状態別の項目 */}
                  {selectedBeetle.status === 'Larva' && (
                    <>
                      {selectedBeetle.parentSpawnSetId && (
                        <InfoRow 
                          label="産卵セット" 
                          value={beetles.find(b => b.id === selectedBeetle.parentSpawnSetId)?.name || '不明'} 
                        />
                      )}
                      <InfoRow label="孵化日 / セット期間" value={selectedBeetle.hatchDate} />
                      <InfoRow label="雌雄判別" value={selectedBeetle.sexDetermined === 'Male' ? 'オス ♂' : selectedBeetle.sexDetermined === 'Female' ? 'メス ♀' : '不明'} />
                    </>
                  )}
                  {selectedBeetle.status === 'SpawnSet' && (
                    <div className="mt-2 mb-4 p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-700 uppercase mb-1">得られた個体一覧</p>
                      <div className="flex flex-wrap gap-2">
                        {beetles.filter(b => b.parentSpawnSetId === selectedBeetle.id).length > 0 ? (
                          beetles.filter(b => b.parentSpawnSetId === selectedBeetle.id).map(child => (
                            <span 
                              key={child.id} 
                              onClick={() => setSelectedBeetle(child)}
                              className="text-[10px] bg-white text-rose-600 px-2 py-0.5 rounded-full border border-rose-200 cursor-pointer shadow-sm active:scale-95 transition"
                            >
                              {child.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-rose-400">紐付けられた個体はありません</span>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedBeetle.status === 'Adult' && (
                    <>
                      <InfoRow label="幼虫時孵化日" value={selectedBeetle.hatchDate} />
                      <InfoRow label="羽化日" value={selectedBeetle.emergenceDate} />
                      <InfoRow label="後食日" value={selectedBeetle.feedingStartDate} />
                      {calculateDaysToEmergence(selectedBeetle) && <InfoRow label="幼虫期間" value={`${calculateDaysToEmergence(selectedBeetle)} 日`} />}
                    </>
                  )}
                  {selectedBeetle.status === 'SpawnSet' && (
                    <>
                      <InfoRow label="セット日" value={selectedBeetle.setDate} />
                      <InfoRow label="容器" value={selectedBeetle.containerSize} />
                      <InfoRow label="マット" value={selectedBeetle.substrate} />
                      <div className="flex gap-4 pt-2">
                        <div className="flex-1 bg-blue-50 p-2 rounded-lg text-center"><p className="text-[10px] text-blue-400 font-bold">水分</p><p className="font-bold text-blue-700">{selectedBeetle.moisture}</p></div>
                        <div className="flex-1 bg-orange-50 p-2 rounded-lg text-center"><p className="text-[10px] text-orange-400 font-bold">詰圧</p><p className="font-bold text-orange-700">{selectedBeetle.packingPressure}</p></div>
                      </div>
                      <InfoRow label="同居" value={selectedBeetle.cohabitation === 'Yes' ? 'あり' : 'なし'} />
                    </>
                  )}
                  {selectedBeetle.deathDate && <div className="mt-2 p-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg text-center">死亡日: {selectedBeetle.deathDate}</div>}
                </div>
                {selectedBeetle.notes && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex gap-2">
                    <MessageSquare size={14} className="shrink-0 text-slate-400" />
                    <p className="whitespace-pre-wrap">{selectedBeetle.notes}</p>
                  </div>
                )}
                
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => copyBeetleText(selectedBeetle)} 
                    className="text-emerald-600 p-1 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="テキスト出力"
                  ><Copy size={20}/></button>
                  <button onClick={() => startEditBeetle(selectedBeetle)} className="text-blue-500 p-1"><Edit3 size={20}/></button>
                  {selectedBeetle.status === 'Larva' && (
                    <>
                      <button 
                        onClick={() => { setFormData(selectedBeetle); setShowEmergenceForm(true); }} 
                        className="text-emerald-600 p-1 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="羽化処理"
                      ><Bug size={20}/></button>
                      <button 
                        onClick={() => { setFormData(selectedBeetle); setShowDeathForm(true); }} 
                        className="text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                        title="死亡処理"
                      ><Ghost size={20}/></button>
                    </>
                  )}
                  {(selectedBeetle.status === 'Adult' || selectedBeetle.deathDate) && (
                    <button 
                      onClick={() => revertStatus(selectedBeetle)} 
                      className="text-amber-600 p-1 hover:bg-amber-50 rounded-lg transition-colors"
                      title="前の段階に戻す"
                    ><History size={20}/></button>
                  )}
                  <button onClick={() => toggleArchive(selectedBeetle.id)} className="text-gray-400 p-1" title="アーカイブ"><Archive size={20}/></button>
                  <button onClick={(e) => deleteBeetle(selectedBeetle.id, e)} className="text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-colors" title="削除"><Trash2 size={20}/></button>
                </div>
              </div>

              {renderLineage(selectedBeetle)}

              {selectedBeetle.status === 'Larva' && !selectedBeetle.archived && (
                <button 
                  onClick={() => {
                    const targets = beetles.filter(b => b.scientificName === selectedBeetle.scientificName && b.status === 'Larva' && !b.archived);
                    setBatchTargets(targets);
                    setSelectedBatchIds(new Set(targets.map(t => t.id)));
                    setShowBatchModal(true);
                  }}
                  className="mt-4 w-full bg-emerald-50 text-emerald-700 py-3 rounded-xl text-xs font-black border border-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                ><RefreshCw size={14}/> 同系統 ({selectedBeetle.scientificName}) を一括記録</button>
              )}

              {/* グラフ表示セクション */}
              {selectedBeetle.records.length > 1 && (
                <div className="mt-6 bg-white p-2 rounded-xl border h-64">
                  <h4 className="text-xs font-bold text-gray-400 mb-2 px-2">GROWTH & TEMP CHART</h4>
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={selectedBeetle.records}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        fontSize={10} 
                        tickFormatter={(value, index) => {
                          const record = selectedBeetle.records[index];
                          return record && record.stage ? `${value}\n(${record.stage})` : value;
                        }}
                      />
                      <YAxis yAxisId="left" orientation="left" stroke="#2563eb" fontSize={10} />
                      <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={10} />
                      <Tooltip labelFormatter={(label, payload) => payload[0]?.payload?.stage ? `${label} (${payload[0].payload.stage})` : label} />
                      <Legend verticalAlign="top" height={36}/>
                      <Line yAxisId="left" type="monotone" dataKey="weight" name="体重(g)" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                      <Line yAxisId="right" type="monotone" dataKey="temperature" name="温度(℃)" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold mb-2 flex items-center gap-2"><Scale size={18}/> 体重記録</h3>
                <div className="flex flex-col gap-2 mb-4">
                  {selectedBeetle.status === 'Larva' && (
                    <div className="grid grid-cols-2 gap-2 mb-2 bg-white p-3 rounded-xl border border-slate-100">
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] text-slate-400 uppercase">交換日 / 記録日</label>
                        <input type="date" className="w-full text-xs border p-2 rounded-lg" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] text-slate-400 uppercase">使用マット</label>
                        <input 
                          placeholder="例: G-pot" 
                          list="substrate-options"
                          className="w-full text-xs border p-2 rounded-lg" 
                          value={newLog.substrate} 
                          onChange={e => setNewLog({...newLog, substrate: e.target.value})} />
                      </div> 
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">加齢状況</label>
                        <select className="w-full text-xs border p-2 rounded-lg" value={newLog.stage} onChange={e => setNewLog({...newLog, stage: e.target.value})}>
                        <option value="L1">L1 (初令)</option>
                        <option value="L2">L2 (2令)</option>
                        <option value="L3">L3 (3令)</option>
                      </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">ボトルサイズ</label>
                        <input 
                          placeholder="例: 800cc" 
                          list="container-options"
                          className="w-full text-xs border p-2 rounded-lg" 
                          value={newLog.containerSize} 
                          onChange={e => setNewLog({...newLog, containerSize: e.target.value})} />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] text-slate-400 uppercase">雌雄判別</label>
                        <select className="w-full text-xs border p-2 rounded-lg" value={selectedBeetle.sexDetermined} onChange={e => setBeetles(beetles.map(b => b.id === selectedBeetle.id ? {...b, sexDetermined: e.target.value} : b))}>
                          <option value="Unknown">不明</option>
                          <option value="Male">オス</option>
                          <option value="Female">メス</option>
                        </select>
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <RatingSelector label="詰圧" icon={Hammer} value={newLog.packingPressure} onChange={v => setNewLog({...newLog, packingPressure: v})} />
                        <RatingSelector label="水分量" icon={Droplets} value={newLog.moisture} onChange={v => setNewLog({...newLog, moisture: v})} />
                      </div>
                      <textarea placeholder="交換時メモ" className="col-span-2 text-xs border p-2 rounded-lg h-12" value={newLog.logNotes} onChange={e => setNewLog({...newLog, logNotes: e.target.value})}></textarea>
                    </div>
                  )}
                  <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder={selectedBeetle.status === 'Larva' ? "体重 (g) (任意)" : "サイズ (mm) (任意)"}
                    className="flex-1 border border-gray-300 rounded-lg p-2"
                  />
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={newTemp}
                      onChange={(e) => setNewTemp(e.target.value)}
                    placeholder="温度 (℃) (任意)" 
                      className="w-full border border-gray-300 rounded-lg p-2 pr-8"
                    />
                    <button 
                      onClick={fetchSbTemperature}
                      className={`absolute right-2 top-2.5 transition-colors ${isFetchingSb ? "text-emerald-500 animate-spin" : "text-slate-300 hover:text-emerald-500"}`}
                      title="SwitchBotから温度を取得"
                    >
                      <Activity size={16} />
                    </button>
                  </div>
                  </div>
                  <button 
                    onClick={() => addRecord(selectedBeetle.id)}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-all"
                  >記録する</button>
                </div>
                
                <div className="space-y-2">
                  {[...selectedBeetle.records].reverse().map((rec, idx) => (
                    <div key={rec.id} className="bg-white p-3 rounded-lg border border-slate-50 shadow-sm text-sm relative">
                      {editingRecord?.id === rec.id ? (
                        <div className="space-y-2 animate-in fade-in duration-200">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 uppercase">日付</label>
                              <input type="date" className="w-full border p-1 rounded-lg text-xs" value={editingRecord.date} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 uppercase">加齢状況</label>
                              <select className="w-full border p-1 rounded-lg text-xs" value={editingRecord.stage} onChange={e => setEditingRecord({...editingRecord, stage: e.target.value})}>
                                <option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 uppercase">体重(g)</label>
                              <input type="number" placeholder="重さ" className="w-full border p-1 rounded-lg text-xs" value={editingRecord.weight || ''} onChange={e => setEditingRecord({...editingRecord, weight: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 uppercase">温度(℃)</label>
                              <input type="number" placeholder="温度" className="w-full border p-1 rounded-lg text-xs" value={editingRecord.temperature || ''} onChange={e => setEditingRecord({...editingRecord, temperature: e.target.value})} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 uppercase">使用マット</label>
                              <input placeholder="マット" className="w-full border p-1 rounded-lg text-xs" value={editingRecord.substrate || ''} onChange={e => setEditingRecord({...editingRecord, substrate: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 uppercase">ボトルサイズ</label>
                              <input placeholder="ボトルサイズ" className="w-full border p-1 rounded-lg text-xs" value={editingRecord.containerSize || ''} onChange={e => setEditingRecord({...editingRecord, containerSize: e.target.value})} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <RatingSelector label="詰圧" icon={Hammer} value={editingRecord.packingPressure} onChange={v => setEditingRecord({...editingRecord, packingPressure: v})} />
                            <RatingSelector label="水分量" icon={Droplets} value={editingRecord.moisture} onChange={v => setEditingRecord({...editingRecord, moisture: v})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase">備考</label>
                            <textarea placeholder="メモ" className="w-full border p-1 rounded-lg text-xs h-12" value={editingRecord.logNotes || ''} onChange={e => setEditingRecord({...editingRecord, logNotes: e.target.value})} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateRecord(selectedBeetle.id)} className="flex-1 bg-emerald-600 text-white py-1 rounded text-xs font-bold">保存</button>
                            <button onClick={() => setEditingRecord(null)} className="flex-1 bg-slate-200 text-slate-600 py-1 rounded text-xs font-bold">キャンセル</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between font-bold mb-1">
                            <span className="text-slate-400">{rec.date}</span>
                            <span className="text-blue-600">{rec.weight !== null ? `${rec.weight}${selectedBeetle.status === 'Larva' ? 'g' : 'mm'}` : '--'} / {rec.temperature !== null ? `${rec.temperature}℃` : '--'}</span>
                          </div>
                          {rec.substrate && <p className="text-xs text-slate-500">{rec.stage} - {rec.substrate} ({rec.containerSize})</p>}
                          {rec.moisture && <p className="text-[10px] text-slate-400">水分:{rec.moisture} 詰圧:{rec.packingPressure || '--'}</p>}
                          {rec.logNotes && <p className="text-[10px] italic text-slate-500 mt-1">{rec.logNotes}</p>}
                          
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button 
                              onClick={() => setEditingRecord({...rec})}
                              className="text-slate-300 hover:text-blue-500 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={() => deleteRecord(selectedBeetle.id, rec.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t">
              <h3 className="font-bold mb-2 flex items-center gap-2"><ClipboardCheck size={18}/> タスク</h3>
              <div className="space-y-2">
                {(selectedBeetle.tasks || []).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <input type="checkbox" checked={task.completed} onChange={() => toggleTask(selectedBeetle.id, task.id)} className="w-5 h-5" />
                    <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
            <div className="bg-white w-full rounded-t-3xl animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-slate-100 rounded-t-3xl">
                <h2 className="text-xl font-bold text-emerald-800">
                  {`${(categories[formData.status + 's'] || '個体')}${isEditing ? '情報の編集' : '登録'}`}
                </h2>
                <button 
                  onClick={() => { setShowForm(false); setIsEditing(false); }} 
                  className="text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* 画像アップロードセクション */}
              <div className="mb-6 flex justify-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden relative">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={32} className="text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-400">個体写真</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  {formData.image && <button onClick={() => setFormData({...formData, image: null})} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"><X size={14}/></button>}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-500 ml-1">管理名</label>
                  <input 
                    value={formData.name || ''}
                    placeholder="例: OKW-001" 
                    list="name-options"
                    className="w-full border p-3 rounded-xl"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  </div>
                  {!isEditing && (
                    <div className="w-20 space-y-1">
                      <label className="text-xs font-semibold text-gray-500 ml-1">登録数</label>
                      <input type="number" min="1" max="100" value={formData.count} className="w-full border p-3 rounded-xl text-center" onChange={e => setFormData({...formData, count: e.target.value})} />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 ml-1">種類</label>
                  <div className="flex gap-2">
                    <input
                      value={formData.species || ''}
                      placeholder="種類 (例: 国産オオクワガタ)" 
                      list="species-options"
                      className="flex-1 border p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      onChange={(e) => setFormData({...formData, species: e.target.value})}
                    />
                    <button 
                      onClick={() => fetchScientificName(formData.species)}
                      className="bg-emerald-50 text-emerald-600 px-4 rounded-xl border border-emerald-100 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-sm"
                      disabled={isFetchingAI}
                      title="学名を予測"
                    >
                      {isFetchingAI ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 ml-1">学名 (自動入力可)</label>
                  <input 
                    placeholder="例: Dorcus hopei binodulosus"
                    value={formData.scientificName || ''}
                    className="w-full border p-3 rounded-xl bg-gray-50"
                    onChange={(e) => setFormData({...formData, scientificName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 ml-1">産地</label>
                    <input 
                      placeholder="例: 兵庫県川西市" 
                      list="locality-options"
                      className="w-full border p-3 rounded-xl" 
                      value={formData.locality || ''} 
                      onChange={e => setFormData({...formData, locality: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 ml-1">累代</label>
                    <input 
                      placeholder="例: CBF1" 
                      list="generation-options"
                      className="w-full border p-3 rounded-xl" 
                      value={formData.generation || ''} 
                      onChange={e => setFormData({...formData, generation: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">ステータス</label>
                  <select value={formData.status} className="border p-3 rounded-xl" onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Larva">幼虫</option>
                    <option value="Pupa">蛹</option>
                    <option value="Adult">成虫</option>
                    <option value="SpawnSet">産卵セット</option>
                  </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">性別</label>
                    <select value={formData.gender || 'Unknown'} className="border p-3 rounded-xl" onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                      <option value="Unknown">不明</option>
                      <option value="Male">オス</option>
                      <option value="Female">メス</option>
                    </select>
                  </div>
                </div>

                {/* ステータス別の入力項目 */}
                {formData.status === 'Adult' && (
                  <div className="grid grid-cols-2 gap-2 bg-emerald-50/50 p-3 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-700 font-bold uppercase">羽化日</label>
                      <input type="date" className="w-full border p-2 rounded-xl text-sm" value={formData.emergenceDate || ''} onChange={e => setFormData({...formData, emergenceDate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-emerald-700 font-bold uppercase">後食日</label>
                      <input type="date" className="w-full border p-2 rounded-xl text-sm" value={formData.feedingStartDate || ''} onChange={e => setFormData({...formData, feedingStartDate: e.target.value})} />
                    </div>
                  </div>
                )}

                {formData.status === 'Larva' && (
                  <div className="space-y-1 bg-amber-50/50 p-3 rounded-2xl">
                    <div className="space-y-1 mb-2">
                      <label className="text-[10px] text-amber-700 font-bold uppercase">元となる産卵セット</label>
                      <select 
                        className="w-full border p-2 rounded-xl text-sm" 
                        value={formData.parentSpawnSetId || ''} 
                        onChange={e => setFormData({...formData, parentSpawnSetId: e.target.value})}
                      >
                        <option value="">(直接登録 / 親不明)</option>
                        {beetles.filter(b => b.status === 'SpawnSet').map(set => (
                          <option key={set.id} value={set.id}>{set.name} ({set.species})</option>
                        ))}
                      </select>
                    </div>
                    <label className="text-[10px] text-amber-700 font-bold uppercase">孵化日 / セット期間 (フリー入力)</label>
                    <input 
                      type="text" 
                      placeholder="例: 2024/01/10 または セット後10日"
                      className="w-full border p-2 rounded-xl text-sm" 
                      value={formData.hatchDate || ''} 
                      onChange={e => setFormData({...formData, hatchDate: e.target.value})} 
                    />
                    <div className="space-y-1 mt-2">
                      <label className="text-[10px] text-amber-700 font-bold uppercase">雌雄判別</label>
                      <select value={formData.sexDetermined || 'Unknown'} className="w-full border p-2 rounded-xl text-sm" onChange={(e) => setFormData({...formData, sexDetermined: e.target.value})}>
                        <option value="Unknown">不明</option>
                        <option value="Male">オス</option>
                        <option value="Female">メス</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.status === 'SpawnSet' && (
                  <div className="space-y-3 bg-rose-50/50 p-3 rounded-2xl">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-rose-700 font-bold uppercase">セット日</label>
                        <input type="date" className="w-full border p-2 rounded-xl text-sm" value={formData.setDate || ''} onChange={e => setFormData({...formData, setDate: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-rose-700 font-bold uppercase">同居</label>
                        <select className="w-full border p-2 rounded-xl text-sm" value={formData.cohabitation || 'No'} onChange={e => setFormData({...formData, cohabitation: e.target.value})}>
                          <option value="No">なし</option>
                          <option value="Yes">あり</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        placeholder="使用マット" 
                        list="substrate-options"
                        className="border p-2 rounded-xl text-sm" 
                        value={formData.substrate || ''} 
                        onChange={e => setFormData({...formData, substrate: e.target.value})} />
                      <input 
                        placeholder="容器サイズ" 
                        list="container-options"
                        className="border p-2 rounded-xl text-sm" 
                        value={formData.containerSize || ''} 
                        onChange={e => setFormData({...formData, containerSize: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-rose-700 font-bold uppercase flex items-center gap-1"><Hammer size={12}/> 詰圧</label>
                        <input placeholder="例: 普通" className="w-full border p-2 rounded-xl text-sm" value={formData.packingPressure} onChange={e => setFormData({...formData, packingPressure: e.target.value})} />
                      </div>
                      <RatingSelector label="水分量" icon={Droplets} value={formData.moisture} onChange={v => setFormData({...formData, moisture: v})} />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase ml-1">備考欄</label>
                  <textarea placeholder="産卵セットの詳細や個体の特徴など..." className="w-full border p-3 rounded-xl text-sm h-24" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>

                {/* 共通項目: 死亡日 */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase ml-1">死亡日 (任意)</label>
                  <input type="date" className="w-full border p-2 rounded-xl text-sm" value={formData.deathDate || ''} onChange={e => setFormData({...formData, deathDate: e.target.value})} />
                </div>
              </div>
              <button 
                onClick={handleAddBeetle}
                className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition mb-6"
              >
                {isEditing ? '更新して登録' : '登録する'}
              </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Emergence Form Modal */}
      {showEmergenceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-3xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-slate-100 rounded-t-3xl">
              <h2 className="text-xl font-bold text-emerald-800">{formData.name} 羽化処理</h2>
              <button onClick={() => setShowEmergenceForm(false)} className="text-gray-400"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase ml-1">羽化日</label>
                <input type="date" className="w-full border p-3 rounded-xl text-sm" value={formData.emergenceDate || ''} onChange={e => setFormData({...formData, emergenceDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase ml-1">後食開始日</label>
                <input type="date" className="w-full border p-3 rounded-xl text-sm" value={formData.feedingStartDate || ''} onChange={e => setFormData({...formData, feedingStartDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase ml-1">性別</label>
                <select value={formData.gender || 'Unknown'} className="w-full border p-3 rounded-xl text-sm" onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                  <option value="Unknown">不明</option>
                  <option value="Male">オス</option>
                  <option value="Female">メス</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase ml-1">サイズ (mm)</label>
                <input type="number" placeholder="例: 80" className="w-full border p-3 rounded-xl text-sm" value={formData.adultSize || ''} onChange={e => setFormData({...formData, adultSize: e.target.value})} />
              </div>
              <button 
                onClick={handleEmergenceSubmit}
                className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition mb-4"
              >
                羽化情報を登録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Death Form Modal */}
      {showDeathForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-3xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-slate-100 rounded-t-3xl">
              <h2 className="text-xl font-bold text-rose-800">{formData.name} 死亡処理</h2>
              <button onClick={() => setShowDeathForm(false)} className="text-gray-400"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase ml-1">死亡日</label>
                <input type="date" className="w-full border p-3 rounded-xl text-sm" value={formData.deathDate || ''} onChange={e => setFormData({...formData, deathDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase ml-1">備考</label>
                <textarea placeholder="死亡原因など..." className="w-full border p-3 rounded-xl text-sm h-24" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <button 
                onClick={handleDeathSubmit}
                className="w-full bg-rose-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition mb-4"
              >
                死亡情報を登録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistical Graph Modal */}
      {statGraphInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 leading-tight">{statGraphInfo.title}</h3>
              <button onClick={() => setStatGraphInfo(null)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-4 min-h-[400px] max-h-[75vh] overflow-auto">
              {statGraphInfo.data.length > 0 ? (
                statViewMode === 'graph' ? (
                  <div className="h-80 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statGraphInfo.data} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={9} fontWeight="bold" stroke="#94a3b8" />
                        <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" unit={statGraphInfo.unit} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" name={statGraphInfo.unit} radius={[6, 6, 0, 0]}>
                          {statGraphInfo.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={statGraphInfo.color} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-inner">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-500 sticky top-0 uppercase font-black">
                        <tr>
                          {[
                            {label: '個体名', key: 'name'},
                            {label: statGraphInfo.unit || '値', key: 'value'},
                            {label: '温度', key: 'temp'},
                          {label: '水分量', key: 'moisture'},
                          {label: '詰圧力', key: 'packing'}
                          ].map(col => (
                            <th 
                              key={col.key}
                              onClick={() => setStatSortConfig({ key: col.key, direction: statSortConfig.key === col.key && statSortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                            className={`px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors border-b whitespace-nowrap ${statSortConfig.key === col.key ? 'text-emerald-700' : ''}`}
                            >
                              {col.label} {statSortConfig.key === col.key ? (statSortConfig.direction === 'desc' ? '▼' : '▲') : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[...statGraphInfo.data].sort((a, b) => {
                          let valA = a[statSortConfig.key];
                          let valB = b[statSortConfig.key];
                          
                          // 数値として比較可能な場合は数値化
                          const numA = parseFloat(valA);
                          const numB = parseFloat(valB);
                          if (!isNaN(numA) && !isNaN(numB)) { valA = numA; valB = numB; }

                          if (valA < valB) return statSortConfig.direction === 'asc' ? -1 : 1;
                          if (valA > valB) return statSortConfig.direction === 'asc' ? 1 : -1;
                          return 0;
                        }).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-3 font-bold text-slate-700 border-b">{row.name}</td>
                            <td className="px-3 py-3 font-black text-emerald-600 border-b">{row.value}{statGraphInfo.unit}</td>
                            <td className="px-3 py-3 text-slate-500 border-b">{row.temp}℃</td>
                            <td className="px-3 py-3 text-slate-500 border-b">{row.moisture}</td>
                            <td className="px-3 py-3 text-slate-500 border-b">{row.packing}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold">データがありません</div>
              )}
            </div>
            <div className="p-4 bg-slate-50 flex gap-2 border-t border-slate-100">
              <button 
                onClick={() => setStatViewMode(statViewMode === 'graph' ? 'table' : 'graph')}
                className="flex-1 bg-emerald-800 text-white py-4 rounded-2xl text-sm font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {statViewMode === 'graph' ? <><List size={18}/> データを一覧で比較 (Excel風)</> : <><BarChart2 size={18}/> グラフ表示に戻る</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Record Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl animate-slide-up max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-slate-100 rounded-t-3xl">
              <div>
                <h2 className="text-xl font-black text-emerald-800">幼虫交換の一括記録</h2>
                <p className="text-[10px] font-bold text-slate-400">{selectedBatchIds.size} / {batchTargets.length} 頭を選択中</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-gray-400"><X size={24} /></button>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">対象個体の選択</label>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedBatchIds(new Set(batchTargets.map(t => t.id)))} className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">全選択</button>
                  <button onClick={() => setSelectedBatchIds(new Set())} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">解除</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-100">
                {batchTargets.map(t => {
                  const latestWeight = t.records?.length > 0 ? t.records[t.records.length - 1].weight : null;
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleBatchSelection(t.id)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${selectedBatchIds.has(t.id) ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-300 opacity-60'}`}
                    >
                      {t.name}
                      {latestWeight !== null && <span className="ml-1 opacity-70 font-normal">({latestWeight}g)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">交換日</label>
                  <input type="date" className="w-full border p-3 rounded-xl text-sm" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">使用マット/菌糸</label>
                  <input 
                    placeholder="ロット共通の餌" 
                    list="substrate-options"
                    className="w-full border p-3 rounded-xl text-sm" 
                    value={newLog.substrate} 
                    onChange={e => setNewLog({...newLog, substrate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">加齢状況</label>
                  <select className="w-full border p-3 rounded-xl text-sm" value={newLog.stage} onChange={e => setNewLog({...newLog, stage: e.target.value})}>
                    <option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">ボトルサイズ</label>
                  <input 
                    placeholder="例: 800cc" 
                    list="container-options"
                    className="w-full border p-3 rounded-xl text-sm" 
                    value={newLog.containerSize} 
                    onChange={e => setNewLog({...newLog, containerSize: e.target.value})} />
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <RatingSelector label="詰圧" icon={Hammer} value={newLog.packingPressure} onChange={v => setNewLog({...newLog, packingPressure: v})} />
                  <RatingSelector label="水分量" icon={Droplets} value={newLog.moisture} onChange={v => setNewLog({...newLog, moisture: v})} />
                </div>
                <div className="space-y-1 col-span-2 mt-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">管理温度(℃)</label>
                  <div className="relative">
                    <input type="number" placeholder="共通温度" className="w-full border p-3 rounded-xl text-sm" value={newTemp} onChange={e => setNewTemp(e.target.value)} />
                    <button onClick={fetchSbTemperature} className="absolute right-3 top-3 text-emerald-600"><Activity size={18}/></button>
                  </div>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">一括メモ</label>
                  <textarea placeholder="ロット全体に関わる特記事項など" className="w-full border p-3 rounded-xl text-sm h-20" value={newLog.logNotes} onChange={e => setNewLog({...newLog, logNotes: e.target.value})} />
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-[10px] text-amber-700 leading-snug">※ 体重は個体ごとに異なるため、一括記録では入力できません。個体詳細画面から個別に記録してください。</p>
              </div>

              <button 
                onClick={handleBatchRecordSubmit}
                className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all mb-8"
              >
                {selectedBatchIds.size}頭に記録を適用する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* サジェスト用データリスト */}
      <datalist id="name-options">
        {existingNames.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="species-options">
        {existingSpecies.map(species => (
          <option key={species} value={species} />
        ))}
      </datalist>
      <datalist id="locality-options">
        {existingLocalities.map(loc => (
          <option key={loc} value={loc} />
        ))}
      </datalist>
      <datalist id="generation-options">
        {existingGenerations.map(gen => (
          <option key={gen} value={gen} />
        ))}
      </datalist>
      <datalist id="substrate-options">
        {existingSubstrates.map(sub => (
          <option key={sub} value={sub} />
        ))}
      </datalist>
      <datalist id="container-options">
        {existingContainers.map(cont => (
          <option key={cont} value={cont} />
        ))}
      </datalist>
    </>
  )
}

export default App
