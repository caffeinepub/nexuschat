import { PowerOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface ShutdownOverlayProps {
  active: boolean;
  reason: string;
  endsAt: bigint;
  startedBy: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

export default function ShutdownOverlay({
  active,
  reason,
  endsAt,
  startedBy,
}: ShutdownOverlayProps) {
  const [msRemaining, setMsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!active) return;

    const computeMs = () => {
      // endsAt is in nanoseconds from the backend
      const endsAtMs = Number(endsAt) / 1_000_000;
      return Math.max(0, endsAtMs - Date.now());
    };

    setMsRemaining(computeMs());

    const interval = setInterval(() => {
      setMsRemaining(computeMs());
    }, 1000);

    return () => clearInterval(interval);
  }, [active, endsAt]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="shutdown-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ backgroundColor: "rgb(0, 0, 0)" }}
        >
          {/* Subtle scanline texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.015) 2px, rgba(255,0,0,0.015) 4px)",
            }}
          />

          {/* Pulsing red glow in background */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.05, 0.12, 0.05] }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.35 0.22 22 / 0.8), transparent)",
            }}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center gap-6 px-8 max-w-lg text-center"
          >
            {/* Icon */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="rounded-full p-6"
              style={{
                background: "oklch(0.18 0.10 22 / 0.6)",
                border: "2px solid oklch(0.62 0.22 22 / 0.5)",
                boxShadow:
                  "0 0 40px oklch(0.62 0.22 22 / 0.4), 0 0 80px oklch(0.62 0.22 22 / 0.2)",
              }}
            >
              <PowerOff
                className="w-14 h-14"
                style={{ color: "oklch(0.72 0.22 22)" }}
                strokeWidth={1.5}
              />
            </motion.div>

            {/* Title */}
            <div className="space-y-1">
              <motion.h1
                className="text-4xl font-bold tracking-[0.3em] uppercase"
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  color: "oklch(0.78 0.22 22)",
                  textShadow:
                    "0 0 20px oklch(0.62 0.22 22 / 0.8), 0 0 40px oklch(0.62 0.22 22 / 0.4)",
                }}
                animate={{ opacity: [0.85, 1, 0.85] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                SERVER SHUTDOWN
              </motion.h1>

              <p
                className="text-xs tracking-[0.4em] uppercase"
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  color: "oklch(0.50 0.10 22)",
                }}
              >
                ── maintenance in progress ──
              </p>
            </div>

            {/* Reason */}
            {reason && (
              <div
                className="rounded-md px-5 py-3 border w-full"
                style={{
                  backgroundColor: "oklch(0.10 0.06 22 / 0.5)",
                  borderColor: "oklch(0.62 0.22 22 / 0.3)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-widest mb-1"
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    color: "oklch(0.50 0.10 22)",
                  }}
                >
                  Reason
                </p>
                <p
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    color: "oklch(0.82 0.10 22)",
                  }}
                >
                  {reason}
                </p>
              </div>
            )}

            {/* Countdown timer */}
            <div className="space-y-2">
              <p
                className="text-xs uppercase tracking-[0.3em]"
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  color: "oklch(0.45 0.08 22)",
                }}
              >
                Shutting down in
              </p>
              <div
                className="text-6xl font-bold tabular-nums"
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  color: "oklch(0.80 0.22 22)",
                  textShadow:
                    "0 0 30px oklch(0.62 0.22 22 / 0.7), 0 0 60px oklch(0.62 0.22 22 / 0.3)",
                  letterSpacing: "0.05em",
                }}
              >
                {formatCountdown(msRemaining)}
              </div>
            </div>

            {/* Started by */}
            <p
              className="text-xs"
              style={{
                fontFamily: "'Geist Mono', monospace",
                color: "oklch(0.38 0.06 22)",
              }}
            >
              Initiated by{" "}
              <span style={{ color: "oklch(0.55 0.10 22)" }}>{startedBy}</span>
            </p>

            {/* Bottom separator */}
            <div
              className="w-full h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.62 0.22 22 / 0.4), transparent)",
              }}
            />
            <p
              className="text-[11px] text-center"
              style={{
                fontFamily: "'Geist Mono', monospace",
                color: "oklch(0.30 0.05 22)",
              }}
            >
              Please wait. The server will be back online shortly.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
