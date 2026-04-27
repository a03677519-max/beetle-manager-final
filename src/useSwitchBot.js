import { useState, useEffect } from 'react';
import { getItem, setItem } from './db.js';

export const useSwitchBot = (appDispatch, ACTION_TYPES) => {
  const [sbToken, setSbToken] = useState(() => {
    try { return localStorage.getItem('beetle_sb_token') || ''; } catch { return ''; }
  });
  const [sbSecret, setSbSecret] = useState(() => {
    try { return localStorage.getItem('beetle_sb_secret') || ''; } catch { return ''; }
  });
  const [selectedSbDeviceId, setSelectedSbDeviceId] = useState('');
  const [availableSbDevices, setAvailableSbDevices] = useState([]);
  const [tempHistory, setTempHistory] = useState({});
  const [sbDeviceOrder, setSbDeviceOrder] = useState([]);

  // 初期ロード
  useEffect(() => {
    const loadSwitchBotData = async () => {
      const history = await getItem('beetle_temp_history', {});
      setTempHistory(history);

      const savedSelectedDeviceId = await getItem('beetle_sb_device_id', '');
      setSelectedSbDeviceId(savedSelectedDeviceId);

      const savedAvailableDevices = await getItem('beetle_sb_devices', []);
      setAvailableSbDevices(savedAvailableDevices);

      const savedDeviceOrder = await getItem('beetle_sb_device_order', []);
      setSbDeviceOrder(savedDeviceOrder);
    };
    loadSwitchBotData();
  }, []);

  useEffect(() => { localStorage.setItem('beetle_sb_token', sbToken); }, [sbToken]);
  useEffect(() => { localStorage.setItem('beetle_sb_secret', sbSecret); }, [sbSecret]);
  useEffect(() => { setItem('beetle_sb_device_id', selectedSbDeviceId); }, [selectedSbDeviceId]); // localStorage -> IndexedDB
  useEffect(() => { setItem('beetle_temp_history', tempHistory); }, [tempHistory]);
  useEffect(() => { setItem('beetle_sb_devices', availableSbDevices); }, [availableSbDevices]); // localStorage -> IndexedDB
  useEffect(() => { setItem('beetle_sb_device_order', sbDeviceOrder); }, [sbDeviceOrder]); // localStorage -> IndexedDB

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

  const fetchSbTemperature = async (targetId = null, onTemperatureFetch = null) => {
    if (!sbToken || !sbSecret) {
      alert("SwitchBotのトークンとシークレットを設定画面で入力してください。");
      return;
    }
    const deviceIds = targetId ? [targetId] : (availableSbDevices.length > 0 ? availableSbDevices.map(d => d.deviceId) : [selectedSbDeviceId].filter(Boolean));
    if (deviceIds.length === 0) return;
    
    appDispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isFetchingSb: true } });
    try {
      const headers = await getSwitchBotHeaders(sbToken, sbSecret);
      const newHistories = { ...tempHistory };
      for (const id of deviceIds) {
        const statusRes = await fetch(`/api/switchbot/v1.1/devices/${id}/status`, { headers });
        const statusData = await statusRes.json();
        if (statusData.statusCode === 100) {
          const tempVal = statusData.body.temperature;
          if (id === selectedSbDeviceId && onTemperatureFetch) onTemperatureFetch(tempVal);
          const entry = {
            time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            displayDate: new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }),
            temp: tempVal
          };
          newHistories[id] = [...(newHistories[id] || []), entry].slice(-30);
        }
      }
      setTempHistory(newHistories);
    } catch (error) {
      console.error("SwitchBot Error:", error); // エラーハンドリングはApp.jsx側で行う
    } finally { appDispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isFetchingSb: false } }); }
  };

  const fetchSbDevices = async () => {
    if (!sbToken || !sbSecret) return;
    appDispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isFetchingSbDevices: true } });
    try {
      const headers = await getSwitchBotHeaders(sbToken, sbSecret);
      const devRes = await fetch("/api/switchbot/v1.1/devices", { headers });
      const devData = await devRes.json();
      if (devData.statusCode === 100) {
        const meters = devData.body.deviceList.filter(d => d.deviceType.includes("Meter") || d.deviceType.includes("SensorTH"));
        setAvailableSbDevices(meters);
        if (meters.length > 0 && (!selectedSbDeviceId || !meters.some(m => m.deviceId === selectedSbDeviceId))) {
          setSelectedSbDeviceId(meters[0].deviceId);
        }
      }
    } catch (error) {
      console.error("SwitchBot Devices Error:", error);
    } finally { appDispatch({ type: ACTION_TYPES.UPDATE_UI, payload: { isFetchingSbDevices: false } }); }
  };

  return {
    sbToken, setSbToken,
    sbSecret, setSbSecret,
    selectedSbDeviceId, setSelectedSbDeviceId,
    availableSbDevices,
    tempHistory,
    sbDeviceOrder, setSbDeviceOrder,
    isFetchingSb,
    isFetchingSbDevices,
    fetchSbTemperature,
    fetchSbDevices
  };
};