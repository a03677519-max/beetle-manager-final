import React, { useState, useEffect, useMemo, useRef, useReducer } from 'react';
import logoImg from './assets/logo.png'; // 画像をインポート
import { 
  Plus, Trash2, History, X, ChevronRight, Scale, ClipboardCheck, 
  Thermometer, User, Home, List, Settings, Search, Droplets, 
  Hammer, Activity, Bug, Egg, FlaskConical, Edit3, MessageSquare, 
  Upload, RefreshCw, ThermometerSnowflake, Ghost, BarChart2, 
  Copy, ArrowUpDown, ChevronLeft, Crown, Bell, BellOff 
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

import { 
  calculateBeetleStats, 
  getAutoTasks, 
  getStatSummary, 
  CATEGORIES,
  parseBeetleText
} from './beetleUtils.js';
import BeetleFormModal from './BeetleFormModal.jsx';
import { useSwitchBot } from './useSwitchBot.js';
import { getItem, setItem, migrateFromLocalStorage } from './db.js';
import { 
  BeetleDetailModal, 
  StatGraphModal, 
  BatchRecordModal, 
  EmergenceModal, 
  DeathModal,
  LightboxModal
} from './BeetleModals.jsx';
// 同様に他のモーダルもインポート...

const ACTION_TYPES = {
  SET_DATA: 'SET_DATA',
  SET_BEETLES: 'SET_BEETLES',
  UPDATE_UI: 'UPDATE_UI',
  UPDATE_FORM: 'UPDATE_FORM',
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SET_BATCH_TARGETS: 'SET_BATCH_TARGETS',
  TOGGLE_BATCH_SELECTION: 'TOGGLE_BATCH_SELECTION',
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_PUSH_PERMISSION: 'SET_PUSH_PERMISSION'
};

const initialFormState = {
  name: '', species: '', scientificName: '', locality: '', type: 'Kuwagata', gender: 'Unknown', sexDetermined: 'Unknown', status: 'Larva', generation: '', isDigOut: false,
  parentMaleId: '', parentFemaleId: '', hatchDate: '', emergenceDate: '', feedingStartDate: '', deathDate: '',
  setDate: '', substrate: '', containerSize: '', packingPressure: '', moisture: 3, cohabitation: 'No', archived: false, notes: '', adultSize: '', parentSpawnSetId: '',
  count: 1, images: [], records: [], temperature: ''
};

const initialState = {
  isLoggedIn: true, // ログイン機能を削除するため、常にtrueとする
  userId: '',
  beetles: [],
  config: { labels: { Adult: '成虫', Larva: '幼虫', SpawnSet: '産卵セット', Pupa: '蛹' } },
  ui: {
    activeTab: 'home',
    filterStatus: 'All',
    scientificNameSearchTerm: '',
    expandedGroup: null,
    statViewMode: 'graph',
    statSortConfig: { key: 'value', direction: 'desc' },
    isFabMenuOpen: false,
    isRefreshing: false,
    pullOffset: 0,
    isSortingMode: false,
    statCardOrder: ['size', 'larval', 'resting', 'lifespan', 'spawn'],
    showSbGraphs: true,
    isFetchingSb: false,
    isFetchingSbDevices: false,
    draggedIdx: null,
    draggedIdxSb: null,
    touchStart: null,
    longPressTimer: null,
    isOnline: navigator.onLine,
    isInitialLoading: true,
    pushPermission: 'Notification' in window ? Notification.permission : 'unsupported'
  },
  modals: {
    form: false,
    detail: null, // selectedBeetle
    batch: false,
    emergence: null,
    death: null,
    statGraph: null,
    lightbox: null,
    batchTargets: [],
    selectedBatchIds: new Set()
  },
  form: {
    data: initialFormState,
    isEditing: false,
    newWeight: '',
    newTemp: '',
    editingRecord: null,
    newLog: { date: new Date().toISOString().split('T')[0], substrate: '', packingPressure: 3, moisture: 3, containerSize: '', stage: 'L1', weight: '', gender: 'Unknown', logNotes: '' }
  }
};

const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_DATA:
      return { ...state, ...action.payload };
    case ACTION_TYPES.SET_BEETLES:
      return { ...state, beetles: action.payload };
    case ACTION_TYPES.UPDATE_UI:
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case ACTION_TYPES.SET_ONLINE_STATUS:
      return { ...state, ui: { ...state.ui, isOnline: action.payload } };
    case ACTION_TYPES.SET_PUSH_PERMISSION:
      return { ...state, ui: { ...state.ui, pushPermission: action.payload } };
    case ACTION_TYPES.UPDATE_FORM:
      return { ...state, form: { ...state.form, ...action.payload } };
    case ACTION_TYPES.OPEN_MODAL:
      return { ...state, modals: { ...state.modals, [action.modal]: action.payload || true }, ui: { ...state.ui, isFabMenuOpen: false } };
    case ACTION_TYPES.CLOSE_MODAL:
      return { ...state, modals: { ...state.modals, [action.modal]: action.modal === 'detail' || action.modal === 'statGraph' || action.modal === 'lightbox' ? null : false } };
    // ログイン機能を削除するため、LOGIN/LOGOUTアクションは不要
    // case ACTION_TYPES.LOGIN:
    //   return { ...state, isLoggedIn: true, userId: action.payload };
    // case ACTION_TYPES.LOGOUT:
    //   return { ...state, isLoggedIn: false, userId: '', beetles: [], modals: { ...initialState.modals } };
    case ACTION_TYPES.SET_BATCH_TARGETS:
      return { ...state, modals: { ...state.modals, batchTargets: action.payload, selectedBatchIds: new Set(action.payload.map(t => t.id)) } };
    case ACTION_TYPES.TOGGLE_BATCH_SELECTION:
      const newSet = new Set(state.modals.selectedBatchIds);
      if (newSet.has(action.payload)) newSet.delete(action.payload);
      else newSet.add(action.payload);
      return { ...state, modals: { ...state.modals, selectedBatchIds: newSet } };
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const { beetles, config, isLoggedIn, userId, ui, modals, form } = state;
  const isDataLoaded = useRef(false);

  // 入力補完用の派生データ
  const existingNames = useMemo(() => Array.from(new Set(beetles.map(b => b.name).filter(Boolean))), [beetles]); // existingNames
  const existingSpecies = useMemo(() => Array.from(new Set(beetles.map(b => b.species).filter(Boolean))), [beetles]);
  const existingScientificNames = useMemo(() => Array.from(new Set(beetles.map(b => b.scientificName).filter(Boolean))), [beetles]);
  const existingLocalities = useMemo(() => Array.from(new Set(beetles.map(b => b.locality).filter(Boolean))), [beetles]);
  const existingGenerations = useMemo(() => Array.from(new Set(beetles.map(b => b.generation).filter(Boolean))), [beetles]);

  const {
    sbToken, setSbToken, sbSecret, setSbSecret, selectedSbDeviceId, setSelectedSbDeviceId, availableSbDevices,
    tempHistory, sbDeviceOrder, setSbDeviceOrder,
    fetchSbTemperature, fetchSbDevices
  } = useSwitchBot(dispatch, ACTION_TYPES); // dispatchをuseSwitchBotに渡す

  const { 
    activeTab, filterStatus, scientificNameSearchTerm, expandedGroup, 
    isSortingMode, showSbGraphs, draggedIdx, draggedIdxSb, longPressTimer, 
    pullOffset, isRefreshing, isFetchingSb, isFetchingSbDevices 
  } = ui;
  const { editingRecord } = form;

  // 非同期でのデータ初期化
  useEffect(() => {
    const loadInitialData = async () => {
      const currentId = localStorage.getItem('beetle_user_id') || '';
      // 初回のみ移行を実行
      if (!localStorage.getItem('beetle_db_migrated')) {
        await migrateFromLocalStorage([`beetle_pwa_data_${currentId}`, 'beetle_app_config', 'beetle_temp_history']);
        localStorage.setItem('beetle_db_migrated', 'true');
      }

      const savedBeetles = await getItem(`beetle_pwa_data_${currentId}`, []);
      const savedConfig = await getItem('beetle_app_config', initialState.config);
      
      dispatch({
        type: ACTION_TYPES.SET_DATA, 
        payload: { 
          beetles: savedBeetles, 
          config: savedConfig,
          isLoggedIn: true, // ログイン機能を削除するため、常にtrue
          ui: { ...state.ui, isInitialLoading: false, pushPermission: 'Notification' in window ? Notification.permission : 'unsupported' },
          userId: currentId,
        } 
      });
      isDataLoaded.current = true;
    };
    loadInitialData();
  }, []);

  const getGuide = (group) => {
    // 実際の産卵セットデータから産卵効率の一番良かったものを取得
    const sortedRankings = [...group.spawnSetRankings].sort((a, b) => b.value - a.value);
    const best = sortedRankings[0];
    if (best && best.value > 0) {
      return {
        content: `最高実績: ${best.value}頭/日 - 温度: ${best.temp}℃ / 水分: ${best.moisture} / 詰圧: ${best.packing}`,
        isGuideline: false
      };
    }
    return { content: "データなし", isGuideline: false };
  };

  // 並べ替えハンドラ
  const onDragStart = (idx) => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { draggedIdx: idx } });
  const onDragOver = (e) => e.preventDefault();
  
  // 温度計の並べ替えハンドラ
  const onDragStartSb = (idx) => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { draggedIdxSb: idx } }); // ui.draggedIdxSb
  const onDropSb = (idx) => {
    const devices = availableSbDevices.filter(d => tempHistory[d.deviceId]);
    const order = devices.map(d => d.deviceId);
    const item = order.splice(ui.draggedIdxSb, 1)[0];
    order.splice(idx, 0, item);
    setSbDeviceOrder(order);
    dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { draggedIdxSb: null } });
  };

  const sortedSbDevices = useMemo(() => {
    const devices = availableSbDevices.filter(d => tempHistory[d.deviceId]);
    if (sbDeviceOrder.length === 0) return devices;
    return [...devices].sort((a, b) => {
      const idxA = sbDeviceOrder.indexOf(a.deviceId);
      const idxB = sbDeviceOrder.indexOf(b.deviceId);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [availableSbDevices, tempHistory, sbDeviceOrder]);

  const onDrop = (idx) => {
    const newOrder = [...ui.statCardOrder];
    const item = newOrder.splice(ui.draggedIdx, 1)[0];
    newOrder.splice(idx, 0, item);
    dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { statCardOrder: newOrder, draggedIdx: null } });
  };

  // オンライン/オフライン状態の監視
  useEffect(() => {
    const handleOnline = () => dispatch({ type: ACTION_TYPES.SET_ONLINE_STATUS, payload: true });
    const handleOffline = () => dispatch({ type: ACTION_TYPES.SET_ONLINE_STATUS, payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save data
  useEffect(() => {
    if (beetles.length > 0) isDataLoaded.current = true;
  }, []);

  useEffect(() => {
    if (isDataLoaded.current && isLoggedIn && userId) {
      setItem(`beetle_pwa_data_${userId}`, beetles); // beetles
    }
  }, [beetles, isLoggedIn, userId]);

  useEffect(() => {
    // ログイン機能を削除するため、isLoggedInの保存は不要
    // setItem('beetle_is_logged_in', isLoggedIn);
  }, []);

  // User IDの保存
  useEffect(() => {
    setItem('beetle_user_id', userId || 'default_user'); // ログインなしの場合のデフォルトユーザーID
  }, [userId]); // userId

  // Configの保存
  useEffect(() => { // config
    setItem('beetle_app_config', config);
  }, [config]);

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
      setItem('beetle_auto_backup_data', backupData); // IndexedDBに保存
      setItem('beetle_last_backup_date', today); // IndexedDBに保存
      console.log("Auto-backup snapshot created for today."); // beetles, config, userId
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

  const handleImportFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.includes('和名 ') || !text.includes('累代 ')) {
        alert('有効な形式のテキストがクリップボードに見つかりません。');
        return;
      }
      const parsedData = parseBeetleText(text);
      const mergedData = { ...initialFormState, ...parsedData };
      dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: mergedData } });
    } catch (err) {
      alert('クリップボードの読み取りに失敗しました。権限を許可してください。');
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
      const reader = new FileReader(); // FileReaderは同期的なので問題なし
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.beetles && Array.isArray(data.beetles)) {
          if (window.confirm('データを復元しますか？現在のデータはすべて上書きされます。')) {
            dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: data.beetles }); // setBeetles
            if (data.config) dispatch({ type: ACTION_TYPES.SET_DATA, payload: { config: data.config } }); // setConfig
            if (data.userId) dispatch({ type: ACTION_TYPES.SET_DATA, payload: { userId: data.userId } }); // setUserId
            alert('バックアップから復元しました。'); // beetles, config, userId
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

    // 履歴データ
    for (let i = 0; i < 5; i++) {
      const rec = beetle.records && beetle.records[i];
      if (rec) {
        text += ` ${rec.date || ''} ${rec.substrate || ''} 水${rec.moisture || ''} 圧${rec.packingPressure || ''} ${rec.containerSize || ''} ${rec.stage || ''}\n`;
      } else if (i < 2) {
        text += `\n`;
      }
    }

    const emergenceDateFormatted = beetle.emergenceDate ? beetle.emergenceDate : '\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000'; // 全角スペース10個
    const feedingStartDateFormatted = beetle.feedingStartDate ? beetle.feedingStartDate : '\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000\u3000'; // 全角スペース10個

    text += `\n\u3000\u3000\u3000${emergenceDateFormatted} 羽化・堀\u3000${feedingStartDateFormatted} 後食`;

    if (!navigator.clipboard) {
      alert('このブラウザではクリップボードへのコピーがサポートされていません。');
      return;
    }

    navigator.clipboard.writeText(text)
      .then(() => alert('個体データをテキスト形式でコピーしました。'))
      .catch(err => alert('コピーに失敗しました: ' + err));
  };

  // スワイプ更新ロジック
  const handleTouchStart = (e) => {
    // 何らかのモーダルが開いているかチェック
    const isAnyModalOpen = Object.values(modals).some(val => 
      val === true || (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Set))
    );

    // モーダル表示中やリストが一番上にない時はリロード判定をスキップ
    if (isAnyModalOpen || window.scrollY !== 0) {
      dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { touchStart: null } });
      return;
    }
    dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { touchStart: e.targetTouches[0].clientY } });
  };
  const handleTouchMove = (e) => {
    if (ui.touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientY;
    const pull = currentTouch - ui.touchStart; // ui.touchStart
    
    // 下方向へのスワイプ量を追跡（視覚フィードバック用）
    if (pull > 0 && window.scrollY === 0) {
      dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { pullOffset: Math.min(pull, 200) } });
    }

    // 下スワイプ(更新)のみを検知し、上スワイプやモーダル内操作による誤動作を防止
    if (pull > 150 && !ui.isRefreshing) {
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isRefreshing: true } });
      window.location.reload();
    }
  };
  const handleTouchEnd = () => {
    dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { touchStart: null, pullOffset: 0 } });
  };

  // ペーストによる自動入力（逆輸入）機能
  useEffect(() => {
    const handlePaste = (e) => {
      // 新規登録フォームが開いている時のみ反応
      if (!modals.form || form.isEditing) return;
      
      const text = e.clipboardData?.getData('text');
      if (text && text.includes('和名 ') && text.includes('累代 ')) {
        const parsedData = parseBeetleText(text);
        dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: { ...initialFormState, ...parsedData } } });
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [modals.form, form.isEditing]);

  // モーダル表示時にボディのスクロールをロックする
  useEffect(() => {
    const isAnyModalOpen = Object.values(modals).some(val => 
      val === true || (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Set))
    );
    
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [modals]);

  const handleFetchSbTemperature = (targetId = null) => {
    fetchSbTemperature(targetId, (temp) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { newTemp: temp.toString() } })); // form.newTemp
  };

  const startEditBeetle = (beetle) => {
    dispatch({ 
      type: ACTION_TYPES.UPDATE_FORM, 
      payload: { data: { ...beetle }, isEditing: true } 
    });
    dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'form' });
  };

  const handleSaveBeetle = () => {
    const { data, isEditing } = form;
    if (!data.name || !data.species) return alert('管理名と種類は必須です。');

    if (isEditing) {
      const updated = beetles.map(b => b.id === data.id ? data : b);
      dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updated });
      if (modals.detail?.id === data.id) {
        dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: data });
      }
    } else {
      const newBeetles = [];
      for (let i = 0; i < (data.count || 1); i++) {
        const suffix = (data.count > 1) ? `-${String(i + 1).padStart(2, '0')}` : '';
        newBeetles.push({
          ...data,
          id: Date.now() + i,
          name: data.name + suffix,
          records: data.records || [],
          tasks: []
        });
      }
      dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: [...beetles, ...newBeetles] });
    }
    dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'form' });
  };

  const handleEmergenceSubmit = () => {
    const { data } = form;
    if (!data.emergenceDate) return alert('羽化日を入力してください。');
    const updated = beetles.map(b => b.id === data.id ? { ...b, status: 'Adult', emergenceDate: data.emergenceDate } : b);
    dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updated });
    dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'emergence' });
    const target = updated.find(b => b.id === data.id);
    if (modals.detail?.id === data.id) {
      dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: target });
    }
  };

  const handleDeathSubmit = () => {
    const { data } = form;
    if (!data.deathDate) return alert('日付を入力してください。');
    const updated = beetles.map(b => b.id === data.id ? { ...b, deathDate: data.deathDate, archived: true } : b);
    dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updated });
    dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'death' });
    dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'detail' });
  };

  // プッシュ通知の権限リクエスト
  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('このブラウザは通知をサポートしていません。');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      dispatch({ type: ACTION_TYPES.SET_PUSH_PERMISSION, payload: permission });
      if (permission === 'granted') {
        new Notification('BeetleLog', { body: 'プッシュ通知が有効になりました。', icon: logoImg });
      }
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  const handleBatchRecordSubmit = () => {
    if (modals.selectedBatchIds.size === 0) return alert('対象が選択されていません');
    
    const updated = beetles.map(b => {
      if (modals.selectedBatchIds.has(b.id)) {
        const newRecord = { 
          date: form.newLog.date || new Date().toLocaleDateString(), 
          weight: form.newWeight !== '' ? parseFloat(form.newWeight) : null, 
          temperature: form.newTemp !== '' ? parseFloat(form.newTemp) : null, 
          id: Date.now() + Math.random(),
          ...form.newLog
        };
        return { ...b, records: [...b.records, newRecord] };
      }
      return b;
    });
    dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updated });
    dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'batch' });
    alert(`${modals.selectedBatchIds.size}頭の一括記録を完了しました。`);
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
    dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updatedBeetles }); // beetlesを更新
    dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: updatedBeetles.find(b => b.id === beetle.id) }); // 詳細モーダルも更新
  };

  const handleUpdateBeetleImages = (id, images) => {
    const updated = beetles.map(b => b.id === id ? { ...b, images } : b);
    dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updated });
    if (modals.detail?.id === id) {
      dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: { ...modals.detail, images } });
    }
  };

  const toggleTask = (beetleId, taskId) => {
    const updated = beetles.map(b => b.id === beetleId ? {
      ...b,
      tasks: (b.tasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    } : b);
    dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updated }); // beetlesを更新
  };

  // 統計データのメモ化（外部関数を利用）
  const enhancedStats = useMemo(() => {
    const stats = calculateBeetleStats(beetles, scientificNameSearchTerm);
    return stats.sort((a, b) => b.count - a.count);
  }, [beetles, scientificNameSearchTerm]);

  const deleteBeetle = (id, e) => {
    e.stopPropagation();
    if (window.confirm('この個体を削除してもよろしいですか？')) {
      dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: beetles.filter(b => b.id !== id) });
      if (modals.detail?.id === id) dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'detail' }); // 詳細モーダルが開いていたら閉じる
    }
  };

  const deleteRecord = (beetleId, recordId) => {
    if (!window.confirm('この記録を削除してもよろしいですか？')) return;
    const updated = beetles.map(b => {
      if (b.id === beetleId) {
        const updatedRecords = b.records.filter(r => r.id !== recordId);
        if (modals.detail?.id === beetleId) dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: { ...b, records: updatedRecords } });
        return { ...b, records: updatedRecords };
      }
      return b;
    });
    dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updated });
  };

  const handleUpdateRecord = (beetleId) => {
    const updated = beetles.map(b => {
      if (b.id === beetleId) {
        const updatedRecords = b.records.map(r => r.id === form.editingRecord.id ? { ...form.editingRecord, weight: form.editingRecord.weight === '' ? null : parseFloat(form.editingRecord.weight), temperature: form.editingRecord.temperature === '' ? null : parseFloat(form.editingRecord.temperature) } : r);
        const updatedBeetle = { ...b, records: updatedRecords };
        dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: updatedBeetle });
        return updatedBeetle;
      }
      return b;
    });
    dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updated });
    dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { editingRecord: null } });
  };

  const addRecord = (id) => {
    const weightValue = form.newWeight !== '' ? parseFloat(form.newWeight) : null; // Allow null for weight
    const tempValue = form.newTemp !== '' ? parseFloat(form.newTemp) : null; // Allow null for temperature

    const updated = beetles.map(b => { // beetlesはstateから取得
      if (b.id === id) {
        const newRecord = { 
          date: form.newLog.date || new Date().toLocaleDateString(), 
          weight: weightValue, 
          temperature: tempValue, 
          id: Date.now(),
          ...form.newLog
        };
        const updatedBeetle = { ...b, records: [...b.records, newRecord] };
        dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: updatedBeetle });
        return updatedBeetle;
      }
      return b;
    });
    dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: updated });
    dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { 
      newWeight: '', 
      newTemp: '', 
      newLog: { date: new Date().toISOString().split('T')[0], substrate: '', packingPressure: '', moisture: 3, containerSize: '', stage: 'L1', logNotes: '' } 
    }});
  };

  return ( // ui.isOnlineはuseSwitchBotからではなく、Appのuiステートから取得
    <>
      <div className="min-h-screen bg-slate-50 pb-32 font-sans" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {/* Offline Banner */}
        {!ui.isOnline && (
          <div className="bg-rose-600 text-white text-[10px] font-black py-1 px-4 text-center animate-in slide-in-from-top duration-300 sticky top-0 z-50">
            オフラインモード：一部の機能（SwitchBot同期など）が制限されています
          </div>
        )}

        {/* Pull-to-Refresh Visual Indicator */}
        {ui.pullOffset > 20 && !ui.isRefreshing && ( // ui.isRefreshingを参照
          <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform" style={{ transform: `translateY(${Math.min(pullOffset / 3, 40)}px)` }}>
            <div className={`bg-white p-2 rounded-full shadow-md border border-slate-100 flex items-center justify-center transition-all ${pullOffset > 150 ? 'text-emerald-600' : 'text-slate-300'}`}>
              <RefreshCw size={20} style={{ transform: `rotate(${pullOffset * 2}deg)` }} />
            </div>
          </div>
        )}
        {/* ui.isRefreshingを参照 */}
        {isRefreshing && (
          <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
              <RefreshCw size={16} className="animate-spin" />
              <span className="text-xs font-black">更新中...</span>
            </div>
          </div>
        )}
        {/* Header */}
      <header className="bg-white/5 backdrop-blur-2xl text-white border-b border-white/10 px-4 py-3 pt-[calc(1rem+env(safe-area-inset-top))] sticky top-0 z-40 shadow-xl">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <h1 
              onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { activeTab: 'home' } })} 
              className="text-lg font-black tracking-tight flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-all"
            >
              <img src={logoImg} alt="BeetleLog" className="w-8 h-8 rounded-lg object-contain shadow-md border border-white/10" />
              BeetleLog
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1.5 border-r border-slate-100 pr-2 mr-1">
                <button onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: { ...initialFormState, status: 'Adult' }, isEditing: false } }) && dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'form' })} className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center font-black text-[10px] border border-emerald-500/30 active:scale-90 transition-all">成</button>
                <button onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: { ...initialFormState, status: 'Larva' }, isEditing: false } }) && dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'form' })} className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center font-black text-[10px] border border-amber-500/30 active:scale-90 transition-all">幼</button>
                <button onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: { ...initialFormState, status: 'SpawnSet' }, isEditing: false } }) && dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'form' })} className="w-8 h-8 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center font-black text-[10px] border border-rose-500/30 active:scale-90 transition-all">産</button>
              </div>
              <button onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { activeTab: 'settings' } })} className={`p-1.5 rounded-xl transition-colors ${ui.activeTab === 'settings' ? 'bg-white/10 text-emerald-400' : 'text-white/30'}`}> {/* ui.activeTabを参照 */}
                <Settings size={22} />
              </button>
            </div>
          </div>
      </header>

        <main className="max-w-md mx-auto p-4">
          {/* Tab: Home (Main List) */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in duration-500 space-y-4">
              {(() => {
                const filteredBeetles = beetles.filter(b => (filterStatus === 'All' ? !b.archived : b.status === filterStatus && !b.archived));
                return (
                  <>
                    <div className="flex justify-between items-center px-1">
                      <h2 className="text-xl font-bold text-slate-800">
                        {filterStatus === 'All' ? 'すべての個体' : config.labels[filterStatus]}
                      </h2>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-widest">
                        {filteredBeetles.length} UNITS
                      </span>
                    </div>
                    
                    {filteredBeetles.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {filteredBeetles.map(beetle => (
                    <div 
                      key={beetle.id} 
                      onClick={() => dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: beetle })}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-6 shadow-2xl active:scale-[0.98] transition-all relative overflow-hidden group cursor-pointer"
                    >
                      {/* グラデーションオーバーレイ */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:animate-[sweep_3s_infinite]" />
                      
                      <div className="flex gap-4 items-start relative z-10">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border shadow-lg transition-transform group-hover:scale-105 duration-500 ${
                          beetle.status === 'Larva' ? 'bg-amber-500/20 border-amber-500/30 shadow-amber-500/10' : 
                          beetle.status === 'Adult' ? 'bg-emerald-500/20 border-emerald-500/30 shadow-emerald-500/10' :
                          'bg-rose-500/20 border-rose-500/30 shadow-rose-500/10'
                        }`}>
                          {beetle.status === 'Larva' ? <Activity className="text-amber-400" size={28} /> : 
                           beetle.status === 'SpawnSet' ? <Egg className="text-rose-400" size={28} /> :
                           <Bug className="text-emerald-400" size={28} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="text-xl font-black truncate pr-2 text-white tracking-tight">{beetle.name}</h3>
                            <span className={`text-[7px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border backdrop-blur-md ${
                              beetle.status === 'Larva' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                              beetle.status === 'Adult' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}>
                              {config.labels[beetle.status]}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white/50 truncate mb-4 italic">{beetle.species}</p>
                          
                          <div className="flex flex-wrap gap-2">
                            <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5">
                              <Search size={10} className="text-white/30" />
                              <span className="text-[10px] font-black text-white/80">{beetle.locality || '-'}</span>
                            </div>
                            <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5">
                              <Crown size={10} className="text-white/30" />
                              <span className="text-[10px] font-black text-white/80">{beetle.generation || '-'}</span>
                            </div>
                            <div className="bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 ml-auto">
                              <Scale size={10} className="text-emerald-400" />
                              <span className="text-[10px] font-black text-emerald-400">{beetle.records?.length > 0 ? `${beetle.records[beetle.records.length-1].weight}g` : '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in zoom-in duration-700">
                        <div className="relative mb-10">
                          <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full scale-150" />
                          <div className="relative bg-white p-12 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50">
                            <Bug size={80} className="text-slate-100 animate-float" />
                            <div className="absolute -top-1 -right-1 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                              <Plus size={16} className="text-white font-black" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
                          {filterStatus === 'All' ? '個体データが見つかりません' : `${config.labels[filterStatus]}が登録されていません`}
                        </h3>
                        <p className="text-sm text-slate-400 font-medium mb-10 leading-relaxed max-w-[280px]">
                          あなたのブリード記録をここから始めましょう。右下のボタンから最初の個体を登録できます。
                        </p>
                        <button 
                          onClick={() => dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'form' })}
                          className="bg-emerald-600 text-white px-10 py-5 rounded-[2.5rem] font-black text-sm shadow-[0_15px_30px_-5px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center gap-2 group"
                        >
                          <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 最初の一歩を登録する
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Tab: Tasks (Full View) */}
          {activeTab === 'tasks' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-slate-700">全タスク一覧</h3>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">Perfect Clear</span>
              </div>
              
              {(() => {
                const taskBeetles = beetles.filter(b => !b.archived && (b.tasks?.some(t => !t.completed) || getAutoTasks(b).length > 0));
                return taskBeetles.length > 0 ? (
                  <div className="space-y-3">
                    {taskBeetles.map(b => (
                  <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-800">{b.name}</span>
                      <button onClick={() => dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: b })} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">詳細を見る</button>
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
                ) : (
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center animate-in fade-in zoom-in duration-500 shadow-sm">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <ClipboardCheck size={40} />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">すべて完了！</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      現在、予定されている作業はありません。<br/>素晴らしい管理状況です！
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab: Stats (Scientific Name Aggregation) */}
          {activeTab === 'stats' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              {/* SwitchBot Temperature Monitor */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-2">
                <div className="flex justify-between items-center mb-4 px-1 sticky top-0 bg-white/80 backdrop-blur-md py-1 z-10">
                  <h3 className="font-black text-slate-700 flex items-center gap-2">
                    <ThermometerSnowflake className="text-blue-500" size={18} />
                    ルーム温度モニタ
                  </h3>
                  <div className="flex items-center gap-2">
                    {ui.isSortingMode && (
                      <button 
                        onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isSortingMode: false } })}
                        className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full animate-pulse"
                      >
                        完了
                      </button>
                    )}
                    <button onClick={() => handleFetchSbTemperature()} className="text-[10px] font-black text-emerald-400 bg-emerald-50/20 px-3 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-all border border-emerald-500/20 shadow-sm">
                    <RefreshCw size={10} className={isFetchingSb ? "animate-spin" : ""} />
                      一括同期
                    </button>
                    <button onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { showSbGraphs: !ui.showSbGraphs } })} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg active:scale-90 transition-all">
                      {showSbGraphs ? <ChevronLeft size={16} className="-rotate-90" /> : <BarChart2 size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">通知設定</label>
                  <div className="mt-2">
                    <button 
                      onClick={requestPushPermission}
                      disabled={ui.pushPermission === 'granted' || ui.pushPermission === 'unsupported'}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        ui.pushPermission === 'granted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {ui.pushPermission === 'granted' ? <Bell size={20} className="text-emerald-400" /> : <BellOff size={20} />}
                        <span className="text-sm font-black">{ui.pushPermission === 'granted' ? '通知は有効です' : '通知を有効にする'}</span>
                      </div>
                      {ui.pushPermission === 'default' && <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
                {showSbGraphs && Object.keys(tempHistory).length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {sortedSbDevices.map((device, idx) => {
                      const isDragging = ui.draggedIdxSb === idx;
                      const handlePointerDown = () => {
                        if (ui.isSortingMode) return;
                        const timer = setTimeout(() => {
                          dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isSortingMode: true } });
                          if (window.navigator.vibrate) window.navigator.vibrate(80);
                        }, 600);
                        dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { longPressTimer: timer } });
                      };
                      const handlePointerUp = () => {
                        if (ui.longPressTimer) clearTimeout(ui.longPressTimer);
                      };

                      return (
                      <div 
                        key={device.deviceId} 
                        draggable={ui.isSortingMode}
                        onDragStart={(e) => {
                          onDragStartSb(idx);
                          if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={onDragOver}
                        onDrop={() => onDropSb(idx)}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        className={`space-y-2 p-3 rounded-2xl transition-all relative ${
                          ui.isSortingMode ? 'animate-wiggle ring-2 ring-blue-500/30 ring-offset-1 bg-blue-50/30' : 'bg-slate-50/50'
                        } ${isDragging ? 'opacity-30 scale-95 border-2 border-dashed border-slate-200' : ''}`}
                      >
                        <div className="flex justify-between items-center px-1">
                          <p className="text-sm font-black text-slate-700 uppercase">{device.deviceName}</p>
                          {ui.isSortingMode && <ArrowUpDown size={12} className="text-slate-300" />}
                        </div>
                        <div className="h-32 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={tempHistory[device.deviceId]}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="time" fontSize={9} stroke="#94a3b8" />
                              <YAxis domain={['auto', 'auto']} fontSize={9} stroke="#94a3b8" unit="℃" />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                              <Line type="monotone" dataKey="temp" name="温度" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )})}
                  </div>
                ) : showSbGraphs && (
                  <div className="py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">一括更新ボタンを押すと<br/>ここに履歴が自動でプロットされます</p>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-800 px-1">系統・学名別統計</h2>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="学名で検索..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-base focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                  value={ui.scientificNameSearchTerm}
                  onChange={(e) => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { scientificNameSearchTerm: e.target.value } })}
                />
              </div>

              <div className="space-y-1 pb-10">
                {enhancedStats.map(group => {
                  const sizeSum = getStatSummary(group.sizes);
                  const larvalSum = getStatSummary(group.larvalPeriods);
                  const restingSum = getStatSummary(group.restingPeriods);
                  const lifespanSum = getStatSummary(group.lifespans);
                  const isExpanded = ui.expandedGroup === group.name;

                  return (
                    <div key={group.name} className="bg-white border-b border-slate-100 overflow-hidden transition-all">
                      <button 
                        onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { expandedGroup: isExpanded ? null : group.name } })}
                        className="w-full px-5 py-3.5 flex justify-between items-center text-left active:bg-slate-50"
                      >
                        <span className="text-sm font-bold text-emerald-900 uppercase tracking-tight">{group.name}</span>
                        <ChevronRight className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={18} />
                      </button>
                      
                      {isExpanded && (
                        <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-[10px] font-bold text-slate-400 mb-3 border-b border-slate-50 pb-1">{Array.from(group.speciesNames).join(' / ') || '種名未設定'}</p>

                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[9px] font-black text-slate-300 uppercase">
                              Analysis Items {ui.isSortingMode ? '(並べ替え中...)' : '(長押しで並べ替え)'}
                            </p>
                            {ui.isSortingMode && (
                              <button 
                                onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isSortingMode: false } })}
                                className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse shadow-sm"
                              >
                                完了
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {ui.statCardOrder.map((key, idx) => {
                              const isDragging = ui.draggedIdx === idx;
                              
                              const handlePointerDown = () => {
                                if (ui.isSortingMode) return;
                                const timer = setTimeout(() => {
                                  dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isSortingMode: true } });
                                  if (window.navigator.vibrate) window.navigator.vibrate(80);
                                }, 600);
                                dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { longPressTimer: timer } });
                              };
                              const handlePointerUp = () => {
                                if (ui.longPressTimer) clearTimeout(ui.longPressTimer);
                              };

                              const btnProps = {
                                draggable: ui.isSortingMode,
                                onDragStart: (e) => {
                                  onDragStart(idx);
                                  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
                                },
                                onDragOver: onDragOver,
                                onDrop: () => onDrop(idx),
                                onPointerDown: handlePointerDown,
                                onPointerUp: handlePointerUp,
                                onPointerLeave: handlePointerUp,
                                className: `p-3 rounded-xl text-left transition-all relative ${
                                  ui.isSortingMode ? 'animate-wiggle ring-2 ring-emerald-500/30 ring-offset-1' : 'active:scale-95'
                                } ${isDragging ? 'opacity-30 border-2 border-dashed border-slate-300 shadow-inner' : ''}`
                              };

                              switch (key) {
                                case 'size': return (
                                  <button key="size" {...btnProps} onClick={() => { if (ui.isSortingMode) return; dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'statGraph', payload: { title: `${group.name} - サイズ比較`, data: group.sizes, unit: 'mm', color: '#10b981' } }); }} className={`${btnProps.className} bg-emerald-50`}>
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase flex justify-between">サイズ <ArrowUpDown size={8}/></p>
                                    <p className="text-base font-black text-emerald-700">{sizeSum.avg}mm</p>
                                  </button>
                                );
                                case 'larval': return (
                                  <button key="larval" {...btnProps} onClick={() => { if (ui.isSortingMode) return; dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'statGraph', payload: { title: `${group.name} - 幼虫期間比較`, data: group.larvalPeriods, unit: '日', color: '#f59e0b' } }); }} className={`${btnProps.className} bg-amber-50`}>
                                    <p className="text-[9px] font-bold text-amber-600 uppercase flex justify-between">幼虫期間 <ArrowUpDown size={8}/></p>
                                    <p className="text-base font-black text-amber-700">{larvalSum.avg}日</p>
                                  </button>
                                );
                                case 'resting': return (
                                  <button key="resting" {...btnProps} onClick={() => { if (ui.isSortingMode) return; dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'statGraph', payload: { title: `${group.name} - 休眠期間比較`, data: group.restingPeriods, unit: '日', color: '#3b82f6' } }); }} className={`${btnProps.className} bg-blue-50`}>
                                    <p className="text-[9px] font-bold text-blue-600 uppercase flex justify-between">休眠期間 <ArrowUpDown size={8}/></p>
                                    <p className="text-base font-black text-blue-700">{restingSum.avg}日</p>
                                  </button>
                                );
                                case 'lifespan': return (
                                  <button key="lifespan" {...btnProps} onClick={() => { if (ui.isSortingMode) return; dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'statGraph', payload: { title: `${group.name} - 寿命比較`, data: group.lifespans, unit: '日', color: '#6366f1' } }); }} className={`${btnProps.className} bg-indigo-50`}>
                                    <p className="text-[9px] font-bold text-indigo-600 uppercase flex justify-between">寿命 <ArrowUpDown size={8}/></p>
                                    <p className="text-base font-black text-indigo-700">{lifespanSum.avg}日</p>
                                  </button>
                                );
                                case 'spawn': return (
                                  <button key="spawn" {...btnProps} onClick={() => { if (ui.isSortingMode) return; dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'statGraph', payload: { title: `${group.name} - 産卵効率ランキング`, data: group.spawnSetRankings, unit: '頭/日', color: '#ec4899' } }); }} className={`${btnProps.className} bg-pink-50`}>
                                    <p className="text-[9px] font-bold text-pink-600 uppercase flex justify-between">産卵効率 <ArrowUpDown size={8}/></p>
                                    <p className="text-base font-black text-pink-700">{getStatSummary(group.spawnSetRankings).max}頭/日</p>
                                  </button>
                                );
                                default: return null;
                              }
                            })}
                          </div>

                          {/* Breeding Information Guide */}
                          <div className="mb-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                              <FlaskConical size={14} className="text-emerald-600" />
                              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Breeding Guide (飼育の目安)</span>
                            </div>
                            <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                              {(() => {
                                const guide = getGuide(group);
                                return (
                                  <span className="flex items-start gap-1.5">
                                    {guide.isGuideline && <span className="shrink-0 bg-emerald-200 text-emerald-700 text-[8px] font-black px-1 rounded-sm mt-0.5 border border-emerald-300/50">目安</span>}
                                    <span>{guide.content}</span>
                                  </span>
                                );
                              })()}
                            </p>
                            <div className="mt-2 flex gap-1">
                              <span className="text-[8px] bg-white/60 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 font-bold">成功率重視</span>
                              <span className="text-[8px] bg-white/60 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 font-bold">一般的手法</span>
                            </div>
                          </div>

                          {/* Spawning Analysis & Golden Ratio (Combined) */}
                          {group.spawnSetRankings.length > 0 && (() => {
                            const best = [...group.spawnSetRankings].sort((a, b) => b.value - a.value)[0];
                            const bestBeetle = best ? beetles.find(b => b && b.name === best.name?.split(' (')[0]) : null;
                            return (
                              <div className="mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                <div 
                                  className="flex items-center justify-between mb-3 cursor-pointer active:opacity-60"
                                  onClick={() => bestBeetle && dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: bestBeetle })}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="bg-amber-500 text-white p-1 rounded-lg shadow-sm"><Crown size={14} fill="currentColor" /></div>
                                    <span className="text-xs font-black text-amber-800 uppercase">飼育黄金比 (産卵成功データ)</span>
                                  </div>
                                  <ChevronRight size={16} className="text-amber-400" />
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div className="bg-white/50 p-2 rounded-xl text-center border border-amber-100">
                                    <p className="text-[9px] font-bold text-amber-600">採卵効率</p>
                                    <p className="text-sm font-black text-amber-900">{best.value}頭/日</p>
                                  </div>
                                  <div className="bg-white/50 p-2 rounded-xl text-center border border-amber-100">
                                    <p className="text-[9px] font-bold text-amber-600">環境設定</p>
                                    <p className="text-sm font-black text-amber-900">{best.temp}℃ / 水{best.moisture} / 圧{best.packing}</p>
                                  </div>
                                </div>
                                {best.notes && (
                                  <div className="bg-white/80 p-3 rounded-xl text-[10px] text-amber-800 font-medium leading-relaxed italic border border-amber-100 flex gap-2">
                                    <MessageSquare size={12} className="shrink-0 mt-0.5 text-amber-400" />
                                    {best.notes}
                                  </div>
                                )}
                                <button 
                                  onClick={() => { dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'statGraph', payload: { title: `${group.name} - 産卵効率ランキング`, data: group.spawnSetRankings, unit: '頭/日', color: '#ec4899' } }); }}
                                  className="w-full mt-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 text-[10px] font-black rounded-lg transition-colors border border-amber-500/20"
                                >
                                  全産卵セットのランキング・詳細比較を表示
                                </button>
                              </div>
                            );
                          })()}

                          <button 
                            onClick={() => {
                              const targets = beetles.filter(b => b.scientificName === group.name && b.status === 'Larva' && !b.archived);
                              if (targets.length === 0) return alert('記録可能な幼虫がいません');
                              dispatch({ type: ACTION_TYPES.SET_BATCH_TARGETS, payload: targets });
                              dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'batch' });
                            }}
                            className="w-full bg-emerald-900 text-white py-3.5 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
                          >
                            <RefreshCw size={14}/> この系統の幼虫を一括で交換記録
                          </button>

                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-white/50 uppercase flex items-center gap-1"><Thermometer size={12}/> 平均温度: {getStatSummary(group.temps).avg}℃</p>
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
                      onChange={(e) => dispatch({ type: ACTION_TYPES.SET_DATA, payload: { userId: e.target.value } })}
                      className="text-base font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
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
                          onChange={(e) => dispatch({ type: ACTION_TYPES.SET_DATA, payload: { config: { ...config, labels: { ...config.labels, [key]: e.target.value } } } })}
                          className="text-base font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">API設定</label>
                  <div className="space-y-3 mt-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">SwitchBot API Token</p>
                      <input // sbTokenはuseSwitchBotから取得
                        type="password"
                        value={sbToken}
                        onChange={(e) => setSbToken(e.target.value)}
                        className="text-base font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                        placeholder="Token..."
                      />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">SwitchBot Client Secret</p>
                      <input // sbSecretはuseSwitchBotから取得
                        type="password"
                        value={sbSecret}
                        onChange={(e) => setSbSecret(e.target.value)}
                        className="text-base font-bold bg-transparent border-none focus:ring-0 w-full text-slate-800"
                        placeholder="Secret..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">SwitchBotデバイス設定</label>
                  <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 mt-2 shadow-inner">
                    <div className="flex justify-between items-center mb-3 px-1">
                      <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest">温湿度計の選択</p>
                      <button onClick={fetchSbDevices} className={`p-1.5 rounded-lg transition-colors ${isFetchingSbDevices ? "text-emerald-400 animate-spin" : "text-white/40 hover:text-emerald-400"}`} title="デバイスリストを更新">
                        <RefreshCw size={18} />
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                      {availableSbDevices.length === 0 ? (
                        <p className="text-[10px] text-white/20 text-center py-4 italic">デバイスが見つかりません</p>
                      ) : (
                        availableSbDevices.map(device => (
                          <button
                            key={device.deviceId}
                            onClick={() => setSelectedSbDeviceId(device.deviceId)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${
                              selectedSbDeviceId === device.deviceId
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-inner'
                                : 'bg-white/5 border-white/10 text-white/30'
                            }`}
                          >
                            <span className="text-sm font-bold">{device.deviceName}</span>
                            <span className="text-[9px] opacity-40 uppercase tracking-tighter">{device.deviceType}</span>
                          </button>
                        ))
                      )}
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
                    onClick={async () => {
                      const saved = await getItem('beetle_auto_backup_data');
                      if (!saved) return alert('自動バックアップがまだ作成されていません。');
                      const data = JSON.parse(saved);
                      if (window.confirm(`${data.backupDate} の自動バックアップから復元しますか？`)) {
                        dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: data.beetles });
                        if (data.config) dispatch({ type: ACTION_TYPES.SET_DATA, payload: { config: data.config } });
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

                  <button onClick={() => window.confirm('全データを削除しますか？') && dispatch({ type: ACTION_TYPES.SET_BEETLES, payload: [] })} className="w-full text-left p-2 text-sm text-rose-400 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <Trash2 size={18} />
                      <span>全データの初期化</span>
                    </div>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-50">
                  <button onClick={() => { if (window.confirm('ログアウトしますか？（データはブラウザに保存されたままになります）')) { dispatch({ type: ACTION_TYPES.LOGOUT }); } }} className="w-full text-left p-2 text-sm text-rose-600 flex items-center justify-between hover:bg-rose-50 rounded-lg transition-colors">
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

        {/* FAB Menu Backdrop */}
        {ui.isFabMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-20 animate-in fade-in duration-300"
            onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isFabMenuOpen: false } })}
          />
        )}

        {/* FAB Sub Menu Items */}
        {ui.isFabMenuOpen && (
          <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 flex flex-col gap-3 items-end z-30">
            <button 
              onClick={() => {
                dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'form' });
                dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isFabMenuOpen: false } });
              }}
              className="flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500 font-black text-xs animate-in zoom-in-50 slide-in-from-bottom-4 duration-200"
            >
              <Plus size={16} /> 新規個体を登録
            </button>

            <button
              onClick={() => {
                const targets = beetles.filter(b => b.status === 'Larva' && !b.archived);
                if (targets.length === 0) return alert('記録可能な幼虫がいません');
                dispatch({ type: ACTION_TYPES.SET_BATCH_TARGETS, payload: targets });
                dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'batch' });
                dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isFabMenuOpen: false } });
              }}
              className="flex items-center gap-3 bg-white text-emerald-800 px-5 py-3 rounded-2xl shadow-xl border border-emerald-100 font-black text-xs animate-in zoom-in-50 slide-in-from-bottom-8 duration-200"
            >
              <RefreshCw size={16} className="text-emerald-600"/> 系統を一括交換記録
            </button>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-20">
        <nav className="bg-white/60 backdrop-blur-lg border-t border-white/20 px-2 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-between items-center shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
            <button onClick={() => { dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { activeTab: 'home', filterStatus: 'All' } }); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' && filterStatus === 'All' ? 'text-emerald-700 scale-110' : 'text-slate-400'}`}>
              <Home size={26} fill={activeTab === 'home' && filterStatus === 'All' ? "currentColor" : "none"} />
              <span className="text-[10px] font-bold">ホーム</span>
            </button>

            <button onClick={() => { dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { activeTab: 'home', filterStatus: filterStatus === 'Adult' ? 'All' : 'Adult' } }); }} className={`flex flex-col items-center gap-1 transition-all ${filterStatus === 'Adult' && activeTab === 'home' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
              <Bug size={24} />
              <span className="text-[10px] font-bold">成</span>
            </button>

            <button onClick={() => { dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { activeTab: 'home', filterStatus: filterStatus === 'Larva' ? 'All' : 'Larva' } }); }} className={`flex flex-col items-center gap-1 transition-all ${filterStatus === 'Larva' && activeTab === 'home' ? 'text-amber-500 scale-110' : 'text-slate-400'}`}>
              <Activity size={24} />
              <span className="text-[10px] font-bold">幼</span>
            </button>

            <button onClick={() => { dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { activeTab: 'home', filterStatus: filterStatus === 'SpawnSet' ? 'All' : 'SpawnSet' } }); }} className={`flex flex-col items-center gap-1 transition-all ${filterStatus === 'SpawnSet' && activeTab === 'home' ? 'text-rose-500 scale-110' : 'text-slate-400'}`}>
              <Egg size={24} />
              <span className="text-[10px] font-bold">産</span>
            </button>

            <button onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { activeTab: 'tasks' } })} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'tasks' ? 'text-slate-800 scale-110' : 'text-slate-400'}`}>
              <ClipboardCheck size={24} />
              <span className="text-[10px] font-bold">タスク</span>
            </button>

            <button onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { activeTab: 'stats' } })} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-emerald-700 scale-110' : 'text-slate-400'}`}>
              <BarChart2 size={24} />
              <span className="text-[10px] font-bold">分析</span>
            </button>

            <button 
              onClick={() => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isFabMenuOpen: !ui.isFabMenuOpen } })}
              className={`w-10 h-10 bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-center active:scale-90 transition-all duration-300 ${ui.isFabMenuOpen ? 'rotate-[135deg] bg-slate-800' : ''}`}
            >
              <Plus size={24} />
            </button>
          </nav>
        </div>
      </div>

      {/* 詳細モーダルの利用 */}
      <BeetleDetailModal
        beetle={modals.detail}
        onClose={() => dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'detail' })}
        beetles={beetles}
        config={config}
        onCopy={copyBeetleText}
        onEdit={startEditBeetle}
        onEmergence={(b) => { dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: b } }); dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'emergence' }); }}
        onDeath={(b) => { dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: b } }); dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'death' }); }}
        onRevert={revertStatus}
        onDelete={deleteBeetle}
        onUpdateImages={handleUpdateBeetleImages}
        onOpenLightbox={(img) => dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'lightbox', payload: img })}
        newWeight={form.newWeight}
        setNewWeight={(val) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { newWeight: val } })}
        newTemp={form.newTemp}
        setNewTemp={(val) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { newTemp: val } })}
        newLog={form.newLog}
        setNewLog={(val) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { newLog: val } })}
        fetchSbTemp={fetchSbTemperature}
        isFetchingSb={isFetchingSb}
        onAddRecord={addRecord}
        editingRecord={editingRecord}
        setEditingRecord={(val) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { editingRecord: val } })}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={deleteRecord}
      />

      {/* 統計グラフモーダルの利用 */}
      <StatGraphModal
        info={modals.statGraph}
        onClose={() => dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'statGraph' })}
        viewMode={ui.statViewMode}
        setViewMode={(val) => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { statViewMode: val } })}
        sortConfig={ui.statSortConfig}
        setSortConfig={(val) => dispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { statSortConfig: val } })}
        beetles={beetles}
        onSelectBeetle={(name) => {
          const cleanName = name.split(' (')[0];
          const target = beetles.find(b => b.name === cleanName);
          if (target) { dispatch({ type: ACTION_TYPES.OPEN_MODAL, modal: 'detail', payload: target }); dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'statGraph' }); }
        }}
      />

      {/* 一括記録モーダルの利用 */}
      <BatchRecordModal
        isOpen={modals.batch}
        onClose={() => dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'batch' })}
        selectedIds={modals.selectedBatchIds}
        targets={modals.batchTargets}
        onToggle={(id) => dispatch({ type: ACTION_TYPES.TOGGLE_BATCH_SELECTION, payload: id })}
        onSelectAll={() => dispatch({ type: ACTION_TYPES.SET_BATCH_TARGETS, payload: modals.batchTargets })}
        onClearAll={() => dispatch({ type: ACTION_TYPES.SET_BATCH_TARGETS, payload: [] })}
        newLog={form.newLog}
        setNewLog={(val) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { newLog: val } })}
        newTemp={form.newTemp}
        setNewTemp={(val) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { newTemp: val } })}
        onFetchTemp={fetchSbTemperature}
        onSubmit={handleBatchRecordSubmit}
      />

      <LightboxModal
        image={modals.lightbox}
        onClose={() => dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'lightbox' })}
      />

      <EmergenceModal
        isOpen={modals.emergence}
        onClose={() => dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'emergence' })}
        formData={form.data}
        setFormData={(val) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: val } })}
        onSubmit={handleEmergenceSubmit}
      />

      <DeathModal
        isOpen={modals.death}
        onClose={() => dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'death' })}
        formData={form.data}
        setFormData={(val) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: val } })}
        onSubmit={handleDeathSubmit}
      />

      {/* 登録・編集フォームモーダルの利用 */}
      <BeetleFormModal
        isOpen={modals.form}
        onClose={() => dispatch({ type: ACTION_TYPES.CLOSE_MODAL, modal: 'form' })}
        formData={form.data}
        setFormData={(val) => dispatch({ type: ACTION_TYPES.UPDATE_FORM, payload: { data: val } })}
        isEditing={form.isEditing}
        onSave={handleSaveBeetle}
        onImport={handleImportFromClipboard}
        existingNames={existingNames}
        existingSpecies={existingSpecies}
        existingScientificNames={existingScientificNames}
        existingLocalities={existingLocalities}
        existingGenerations={existingGenerations}
      />

    </>
  );
};

export default App;
