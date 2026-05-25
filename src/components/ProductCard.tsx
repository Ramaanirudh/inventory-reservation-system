"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    inventory: {
      warehouseId: string;
      warehouseName: string;
      available: number;
    }[];
  };
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function reserve(
    warehouseId: string
  ) {
    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        "/api/reservations",
        {
          productId: product.id,
          warehouseId,
          quantity: 1,
        }
      );

      router.push(
        `/checkout/${response.data.id}`
      );
    } catch (err: any) {
      console.error(err);

      if (err.response?.status === 409) {
        setError(
          "Not enough stock available"
        );
      } else {
        setError("Reservation failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-xl p-6 shadow-sm">
      <h2 className="text-2xl font-semibold mb-2">
        {product.name}
      </h2>

      <p className="text-gray-600 mb-2">
        {product.description}
      </p>

      <p className="font-bold mb-4">
        ₹{product.price}
      </p>

      <div className="space-y-3">
        {product.inventory.map((item) => (
          <div
            key={item.warehouseId}
            className="border rounded-lg p-4"
          >
            <p className="font-medium">
              {item.warehouseName}
            </p>

            <p className="text-sm mb-2">
              Available: {item.available}
            </p>

            <button
              disabled={
                loading || item.available <= 0
              }
              onClick={() =>
                reserve(item.warehouseId)
              }
              className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading
                ? "Reserving..."
                : "Reserve"}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-red-500 mt-4">
          {error}
        </p>
      )}
    </div>
  );
}
