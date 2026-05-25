import { NextRequest, NextResponse } from "next/server";
import { confirmReservation } from "@/server/services/reservation.service";

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const reservation = await confirmReservation(id);

    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: error.status || 500,
      }
    );
  }
}
