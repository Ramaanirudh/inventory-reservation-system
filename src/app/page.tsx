import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    include: {
      inventory: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">
        Inventory Reservation System
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              description: product.description,
              price: Number(product.price),
              inventory: product.inventory.map((item) => ({
                warehouseId: item.warehouse.id,
                warehouseName: item.warehouse.name,
                available: item.quantity - item.reserved,
              })),
            }}
          />
        ))}
      </div>
    </main>
  );
}
