"use client";

import { useEffect, useState } from "react";

function getTimeLeft(dateStr: string) {
  const diff = new Date(dateStr + "T08:00:00").getTime() - Date.now();
  if (diff <= 0)
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({
  targetDate,
  size = "default",
}: {
  targetDate: string;
  size?: "default" | "large";
}) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) return null;

  const isLarge = size === "large";

  return (
    <div className="flex justify-center gap-4">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hrs" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map((unit) => (
        <div key={unit.label} className="text-center">
          <p
            className={`font-serif font-bold text-dark-green ${
              isLarge ? "text-3xl" : "text-2xl"
            }`}
          >
            {String(unit.value).padStart(2, "0")}
          </p>
          <p
            className={`font-medium uppercase tracking-wider text-dark-green/50 ${
              isLarge ? "text-xs" : "text-xs"
            }`}
          >
            {unit.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export { getTimeLeft };
