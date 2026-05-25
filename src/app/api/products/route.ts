import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const formatted = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      inventory: product.inventory.map((item) => ({
        warehouseId: item.warehouse.id,
        warehouseName: item.warehouse.name,
        quantity: item.quantity,
        reserved: item.reserved,
        available: item.quantity - item.reserved,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
