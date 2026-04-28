import { NextResponse } from "next/server";

import { createHeaders } from "@/app/api/switchbot/_lib";

export async function POST(request: Request) {
  const { token, secret, deviceId } = (await request.json()) as {
    token?: string;
    secret?: string;
    deviceId?: string;
  };

  if (!token || !secret || !deviceId) {
    return NextResponse.json({ message: "missing parameters" }, { status: 400 });
  }

  const response = await fetch(`https://api.switch-bot.com/v1.1/devices/${deviceId}/status`, {
    method: "GET",
    headers: createHeaders(token, secret),
    cache: "no-store",
  });

  const data = (await response.json()) as { body?: { temperature?: number } };

  return NextResponse.json({ temperature: data.body?.temperature ?? 0 });
}
