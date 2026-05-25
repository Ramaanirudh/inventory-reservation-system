"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReservationActions({
  reservationId,
  status,
}: {
  reservationId: string;
  status: string;
}) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function confirm() {
    try {
      setLoading(true);

      await axios.post(
        `/api/reservations/${reservationId}/confirm`
      );

      setMessage(
        "Purchase confirmed successfully"
      );

      router.refresh();
    } catch (err: any) {
      console.error(err);

      if (err.response?.status === 410) {
        setMessage(
          "Reservation expired"
        );
      } else {
        setMessage(
          "Confirmation failed"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function release() {
    try {
      setLoading(true);

      await axios.post(
        `/api/reservations/${reservationId}/release`
      );

      setMessage(
        "Reservation cancelled"
      );

      router.refresh();
    } catch (err) {
      console.error(err);

      setMessage(
        "Cancellation failed"
      );
    } finally {
      setLoading(false);
    }
  }

  if (status !== "PENDING") {
    return (
      <p className="font-semibold">
        Reservation {status}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={confirm}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Confirm Purchase
        </button>

        <button
          onClick={release}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Cancel
        </button>
      </div>

      {message && (
        <p className="font-medium">
          {message}
        </p>
      )}
    </div>
  );
}
