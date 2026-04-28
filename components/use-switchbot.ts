"use client";

import { useState } from "react";

type Device = {
  deviceId: string;
  deviceName: string;
  deviceType?: string;
};

export function useSwitchBot() {
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingDevices, setIsFetchingDevices] = useState(false);

  const fetchDevices = async (token: string, secret: string) => {
    if (!token || !secret) throw new Error("token and secret are required");
    setIsFetchingDevices(true);

    try {
      const response = await fetch("/api/switchbot/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, secret }),
      });

      if (!response.ok) throw new Error("failed to fetch devices");
      const data = (await response.json()) as { devices: Device[] };
      return data.devices;
    } finally {
      setIsFetchingDevices(false);
    }
  };

  const fetchTemperature = async (token: string, secret: string, deviceId: string) => {
    if (!token || !secret || !deviceId) throw new Error("device settings are required");
    setIsFetching(true);

    try {
      const response = await fetch("/api/switchbot/temperature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, secret, deviceId }),
      });

      if (!response.ok) throw new Error("failed to fetch temperature");
      const data = (await response.json()) as { temperature: number };
      return data.temperature;
    } finally {
      setIsFetching(false);
    }
  };

  return { isFetching, isFetchingDevices, fetchDevices, fetchTemperature };
}
