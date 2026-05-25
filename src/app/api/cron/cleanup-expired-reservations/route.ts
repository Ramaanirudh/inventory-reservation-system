import { NextResponse } from "next/server";
import { cleanupExpiredReservations } from "@/server/services/reservation.service";

export async function GET() {
  try {
    const result = await cleanupExpiredReservations();

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to cleanup reservations",
      },
      {
        status: 500,
      }
    );
  }
}
