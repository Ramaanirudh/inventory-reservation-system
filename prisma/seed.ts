import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.reservationItem.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: "Chennai Warehouse",
      location: "Chennai",
    },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
      location: "Bangalore",
    },
  });

  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 15",
      description: "Apple flagship smartphone",
      price: 79999,
    },
  });

  const laptop = await prisma.product.create({
    data: {
      name: "Gaming Laptop",
      description: "High-performance laptop",
      price: 120000,
    },
  });

  await prisma.inventory.createMany({
    data: [
      {
        productId: iphone.id,
        warehouseId: warehouse1.id,
        quantity: 10,
        reserved: 0,
      },
      {
        productId: iphone.id,
        warehouseId: warehouse2.id,
        quantity: 5,
        reserved: 0,
      },
      {
        productId: laptop.id,
        warehouseId: warehouse1.id,
        quantity: 3,
        reserved: 0,
      },
    ],
  });

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // close pg pool connection so process exits cleanly
  });
