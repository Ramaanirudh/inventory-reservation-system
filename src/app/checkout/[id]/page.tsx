import { prisma } from "@/lib/prisma";
import CountdownTimer from "@/components/CountdownTimer";
import ReservationActions from "@/components/ReservationActions";
import { notFound } from "next/navigation";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const reservation =
    await prisma.reservation.findUnique({
      where: {
        id,
      },
      include: {
        items: {
          include: {
            inventory: {
              include: {
                product: true,
                warehouse: true,
              },
            },
          },
        },
      },
    });

  if (!reservation) {
    return notFound();
  }

  const item = reservation.items[0];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-xl mx-auto border rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-6">
          Checkout
        </h1>

        <div className="space-y-3 mb-6">
          <p>
            <strong>Product:</strong>{" "}
            {item.inventory.product.name}
          </p>

          <p>
            <strong>Warehouse:</strong>{" "}
            {item.inventory.warehouse.name}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {reservation.status}
          </p>
        </div>

        <CountdownTimer
          expiresAt={reservation.expiresAt.toISOString()}
        />

        <ReservationActions
          reservationId={reservation.id}
          status={reservation.status}
        />
      </div>
    </main>
  );
}
