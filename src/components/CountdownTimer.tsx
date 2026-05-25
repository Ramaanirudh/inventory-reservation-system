"use client";

import { useEffect, useState } from "react";

export default function CountdownTimer({
  expiresAt,
}: {
  expiresAt: string;
}) {
  const [timeLeft, setTimeLeft] =
    useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();

      const expiry =
        new Date(expiresAt).getTime();

      const distance = expiry - now;

      if (distance <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(
        distance / 1000 / 60
      );

      const seconds = Math.floor(
        (distance / 1000) % 60
      );

      setTimeLeft(
        `${minutes}m ${seconds}s`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="mb-6">
      <p className="text-lg font-semibold">
        Time Remaining: {timeLeft}
      </p>
    </div>
  );
}
