import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@prisma/client";

// Set to 1 minute for faster testing
const RESERVATION_WINDOW_MINUTES = 1;

// Internal helper to release reserved stock back into the available pool
async function releaseReservationInternal(
  tx: any,
  reservation: any
) {
  for (const item of reservation.items) {
    await tx.inventory.update({
      where: {
        id: item.inventoryId,
      },
      data: {
        reserved: {
          decrement: item.quantity,
        },
      },
    });
  }

  await tx.reservation.update({
    where: {
      id: reservation.id,
    },
    data: {
      status: ReservationStatus.RELEASED,
    },
  });
}

// Create a pending reservation with a timeout
export async function createReservation({
  productId,
  warehouseId,
  quantity,
}: {
  productId: string;
  warehouseId: string;
  quantity: number;
}) {
  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    const available = inventory.quantity - inventory.reserved;

    if (available < quantity) {
      const error = new Error("Not enough inventory");
      (error as any).status = 409;
      throw error;
    }

    await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        reserved: {
          increment: quantity,
        },
      },
    });

    const reservation = await tx.reservation.create({
      data: {
        status: ReservationStatus.PENDING,
        expiresAt: new Date(
          Date.now() + RESERVATION_WINDOW_MINUTES * 60 * 1000
        ),
        items: {
          create: {
            inventoryId: inventory.id,
            quantity,
          },
        },
      },
      include: {
        items: true,
      },
    });

    return reservation;
  });
}

// Confirm a reservation (deducts physical inventory and removes reservation hold)
export async function confirmReservation(reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: {
        id: reservationId,
      },
      include: {
        items: true,
      },
    });

    if (!reservation) {
      const error = new Error("Reservation not found");
      (error as any).status = 404;
      throw error;
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      const error = new Error("Reservation already processed");
      (error as any).status = 400;
      throw error;
    }

    if (reservation.expiresAt < new Date()) {
      await releaseReservationInternal(tx, reservation);

      const error = new Error("Reservation expired");
      (error as any).status = 410;
      throw error;
    }

    for (const item of reservation.items) {
      const inventory = await tx.inventory.findUnique({
        where: {
          id: item.inventoryId,
        },
      });

      if (!inventory) {
        continue;
      }

      await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          quantity: {
            decrement: item.quantity,
          },
          reserved: {
            decrement: item.quantity,
          },
        },
      });
    }

    return tx.reservation.update({
      where: {
        id: reservation.id,
      },
      data: {
        status: ReservationStatus.CONFIRMED,
      },
    });
  });
}

// Manually cancel/release a pending reservation
export async function releaseReservation(reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: {
        id: reservationId,
      },
      include: {
        items: true,
      },
    });

    if (!reservation) {
      const error = new Error("Reservation not found");
      (error as any).status = 404;
      throw error;
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      return reservation;
    }

    await releaseReservationInternal(tx, reservation);

    return tx.reservation.findUnique({
      where: {
        id: reservation.id,
      },
    });
  });
}

// Cleanup expired pending reservations
export async function cleanupExpiredReservations() {
  return prisma.$transaction(async (tx) => {
    const expiredReservations =
      await tx.reservation.findMany({
        where: {
          status: ReservationStatus.PENDING,
          expiresAt: {
            lt: new Date(),
          },
        },
        include: {
          items: true,
        },
      });

    for (const reservation of expiredReservations) {
      await releaseReservationInternal(
        tx,
        reservation
      );
    }

    return {
      cleaned: expiredReservations.length,
    };
  });
}
