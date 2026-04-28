"use client";

import { useState } from "react";
import { Field } from "@/components/entry-fields";
import { useSwitchBot } from "@/components/use-switchbot";
import { useBeetleStore } from "@/store/use-beetle-store";

export function SwitchBotCard() {
  const switchBot = useBeetleStore((state) => state.switchBot);
  const updateSwitchBot = useBeetleStore((state) => state.updateSwitchBot);
  const { fetchDevices, fetchTemperature, isFetching, isFetchingDevices } = useSwitchBot();
  const [devices, setDevices] = useState<Array<{ deviceId: string; deviceName: string }>>([]);

  const handleFetchDevices = async () => {
    try {
      const result = await fetchDevices(switchBot.token, switchBot.secret);
      setDevices(result);
    } catch {
      window.alert("SwitchBotデバイスを取得できませんでした。");
    }
  };

  const handleFetchTemperature = async () => {
    try {
      const temperature = await fetchTemperature(switchBot.token, switchBot.secret, switchBot.deviceId);
      window.alert(`現在温度: ${temperature}℃`);
    } catch {
      window.alert("SwitchBot温度を取得できませんでした。");
    }
  };

  return (
    <section className="card form-grid">
      <div className="section-title">SwitchBot設定</div>
      <Field label="Token">
        <input value={switchBot.token} onChange={(event) => updateSwitchBot({ token: event.target.value })} />
      </Field>
      <Field label="Secret">
        <input value={switchBot.secret} onChange={(event) => updateSwitchBot({ secret: event.target.value })} />
      </Field>
      <Field label="対象デバイス">
        <select
          value={switchBot.deviceId}
          onChange={(event) => {
            const nextDevice = devices.find((device) => device.deviceId === event.target.value);
            updateSwitchBot({ deviceId: event.target.value, deviceName: nextDevice?.deviceName ?? "" });
          }}
        >
          <option value="">デバイスを選択</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.deviceName}
            </option>
          ))}
        </select>
      </Field>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={handleFetchDevices}>
          {isFetchingDevices ? "取得中..." : "デバイス取得"}
        </button>
        <button type="button" className="button" onClick={handleFetchTemperature}>
          {isFetching ? "取得中..." : "現在温度を使う"}
        </button>
      </div>
    </section>
  );
}
