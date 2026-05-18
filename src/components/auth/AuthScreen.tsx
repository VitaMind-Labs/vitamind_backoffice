"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { encryptSessionId } from "@/lib/utils";
import { login } from "@/actions/auth";
import Image from "next/image";

export function AuthScreen() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email."); return; }
    if (!password) { setError("Please enter your password."); return; }

    startTransition(async () => {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        const sessionId = encryptSessionId();
        router.push(`/${sessionId}`);
      }
    });
  }

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#222222] lg:text-3xl">Sign in</h1>
            <p className="mt-2 text-sm text-[#518591]/60">
              Access the admin dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#222222]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vitamind.com"
                className="w-full rounded-lg border border-[#518591]/20 bg-white px-4 py-2.5 text-sm text-[#222222] outline-none transition placeholder:text-[#518591]/40 focus:border-[#518591] focus:ring-1 focus:ring-[#518591]/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#222222]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[#518591]/20 bg-white px-4 py-2.5 text-sm text-[#222222] outline-none transition placeholder:text-[#518591]/40 focus:border-[#518591] focus:ring-1 focus:ring-[#518591]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((c) => !c)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#518591]/60 transition-colors hover:text-[#518591]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#518591] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3d646f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:block lg:w-1/2">
        <div className="flex h-full flex-col justify-center bg-gradient-to-br from-[#518591]/5 to-[#e3b01c]/5 px-16">
          <div className="mx-auto max-w-md">
            <div className="mb-8 flex justify-center">
              <div className="flex h-30 w-30 items-center justify-center rounded-xl bg-white/50 border border-[#518591]/20">
                <Image
                  src="/logo.png"
                  alt="VitaMind"
                  width={20}
                  height={20}
                  className="h-20 w-20 object-contain "
                  priority
                />
              </div>
            </div>
            <blockquote className="text-center">
              <p className="text-xl leading-relaxed text-[#222222]">
                &ldquo;Streamline your mental wellness management with our comprehensive admin platform.&rdquo;
              </p>
              <p className="mt-4 text-sm font-medium text-[#518591]">VitaMind Admin</p>
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}