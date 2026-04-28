import { NextResponse } from "next/server";

import { createHeaders } from "@/app/api/switchbot/_lib";

export async function POST(request: Request) {
  const { token, secret } = (await request.json()) as { token?: string; secret?: string };

  if (!token || !secret) {
    return NextResponse.json({ message: "missing credentials" }, { status: 400 });
  }

  const response = await fetch("https://api.switch-bot.com/v1.1/devices", {
    method: "GET",
    headers: createHeaders(token, secret),
    cache: "no-store",
  });

  const data = (await response.json()) as {
    body?: { deviceList?: Array<{ deviceId: string; deviceName: string; deviceType?: string }> };
  };

  const devices =
    data.body?.deviceList?.filter(
      (device) =>
        device.deviceType?.includes("Meter") || device.deviceType?.includes("SensorTH"),
    ) ?? [];

  return NextResponse.json({ devices });
}
