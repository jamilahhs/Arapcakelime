"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export default function Pomodoro() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [active, setActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playSynthesizedAlert = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
        gain.gain.setValueAtTime(0.5, ctx.currentTime);

        osc.start();
        setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 1200);
      } catch (err) {
        console.error("Ses sentezlenemedi:", err);
      }
    }
  }, []);

  const handleSessionEnd = useCallback(() => {
    playSynthesizedAlert();
    setActive(false);

    if (!isBreak) {
      alert("Odaklanma seansı bitti! 5 dakikalık mola başlasın.");
      setIsBreak(true);
      setTimeLeft(5 * 60);
    } else {
      alert("Mola seansı bitti! Hazırsanız yeni seansa başlayabilirsiniz.");
      setIsBreak(false);
      setTimeLeft(25 * 60);
    }
  }, [isBreak, playSynthesizedAlert]);

  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, handleSessionEnd]);

  const toggle = () => setActive(!active);

  const reset = () => {
    setActive(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const format = (sec: number) => {
    const mins = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const secs = (sec % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Percentage for progress indicators
  const totalSeconds = isBreak ? 5 * 60 : 25 * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-8">
      <div>
        <span
          className={`text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider ${
            isBreak
              ? "bg-amber-50 text-amber-600 border border-amber-100"
              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          }`}
        >
          {isBreak ? "☕ Mola Zamanı" : "🧠 Odaklanma Seansı"}
        </span>
      </div>

      {/* Timer Circle visualization */}
      <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
        <svg className="absolute inset-0 h-full w-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="80"
            className="stroke-slate-100 fill-none"
            strokeWidth="10"
          />
          <circle
            cx="96"
            cy="96"
            r="80"
            className={`fill-none transition-all duration-300 ${
              isBreak ? "stroke-amber-400" : "stroke-emerald-600"
            }`}
            strokeWidth="10"
            strokeDasharray={2 * Math.PI * 80}
            strokeDashoffset={
              2 * Math.PI * 80 * (1 - progressPercent / 100)
            }
          />
        </svg>
        <span className="text-4xl font-extrabold text-slate-900 tracking-tight z-10">
          {format(timeLeft)}
        </span>
      </div>

      <div className="flex justify-center gap-4 pt-2">
        <button
          onClick={toggle}
          className={`flex-1 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all ${
            active
              ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
          }`}
        >
          {active ? "Durdur" : "Başlat"}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3.5 rounded-2xl font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all"
        >
          Sıfırla
        </button>
      </div>
    </div>
  );
}
