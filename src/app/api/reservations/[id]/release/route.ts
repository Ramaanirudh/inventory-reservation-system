import { NextRequest, NextResponse } from "next/server";
import { releaseReservation } from "@/server/services/reservation.service";

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const reservation = await releaseReservation(id);

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
