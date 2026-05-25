import { NextRequest, NextResponse } from "next/server";
import { createReservationSchema } from "@/lib/validations/reservation";
import { createReservation } from "@/server/services/reservation.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = createReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const reservation = await createReservation(parsed.data);

    return NextResponse.json(reservation, {
      status: 201,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message || "Reservation failed",
      },
      {
        status: error.status || 500,
      }
    );
  }
}
