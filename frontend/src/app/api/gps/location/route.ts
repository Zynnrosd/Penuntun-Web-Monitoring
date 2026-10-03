// frontend/src/app/api/gps/location/route.ts

import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  "http://127.0.0.1:4000";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      id_perangkat,
      gps_token,
      latitude,
      longitude,
      accuracy,
    } = body;

    const response = await fetch(
      `${BACKEND_URL}/gps/location`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": id_perangkat,
          "x-gps-token": gps_token,
        },
        body: JSON.stringify({
          latitude,
          longitude,
          accuracy,
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Gagal mengirim lokasi",
      },
      {
        status: 500,
      }
    );
  }
}