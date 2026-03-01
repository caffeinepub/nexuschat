import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useRegister } from "@/hooks/useQueries";
import { Loader2, Lock, User, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface AuthScreenProps {
  isRegistered: boolean;
  onRegistered: () => void;
}

export default function AuthScreen({
  isRegistered,
  onRegistered,
}: AuthScreenProps) {
  const { login, clear, identity, isLoggingIn, isLoginSuccess } =
    useInternetIdentity();
  const [username, setUsername] = useState("");
  const register = useRegister();

  const isLoggedIn = !!identity;

  const handleRegister = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error("Username cannot be empty");
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 24) {
      toast.error("Username must be 2–24 characters");
      return;
    }
    try {
      await register.mutateAsync(trimmed);
      toast.success(`Welcome to NexusChat, ${trimmed}!`);
      onRegistered();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.62 0.22 255) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.62 0.22 255) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, oklch(0.62 0.22 255), transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle, oklch(0.52 0.22 295), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-16 h-16 rounded-2xl nexus-glow flex items-center justify-center mb-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))",
            }}
          >
            <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
          </motion.div>
          <h1 className="font-display text-4xl font-bold tracking-tight nexus-text-glow">
            NexusChat
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono-custom">
            real-time communication network
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl border border-border p-8"
          style={{ backgroundColor: "oklch(var(--nexus-surface-1))" }}
        >
          {!isLoggedIn ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-lg">
                  Secure Login
                </h2>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                Connect with Internet Identity to join the network.
              </p>
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full h-12 font-display font-semibold text-base nexus-glow-sm transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))",
                  color: "white",
                }}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Login with Internet Identity
                  </>
                )}
              </Button>
              {isLoginSuccess && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Redirecting...
                </p>
              )}
            </motion.div>
          ) : !isRegistered ? (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-lg">
                  Choose Your Handle
                </h2>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                Pick a username to identify yourself on the network.
              </p>
              <div className="space-y-3">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="enter username..."
                  className="h-12 font-mono-custom bg-muted border-border focus:border-primary focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleRegister();
                  }}
                  maxLength={24}
                  autoFocus
                />
                <Button
                  onClick={() => void handleRegister()}
                  disabled={register.isPending || !username.trim()}
                  className="w-full h-12 font-display font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))",
                    color: "white",
                  }}
                >
                  {register.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Join NexusChat"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={clear}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Use a different account
                </button>
              </div>
            </motion.div>
          ) : null}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
