"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Determine if it's a 403 error based on the error message
  const isForbidden = error.message?.toLowerCase().includes("403") ||
    error.message?.toLowerCase().includes("forbidden") ||
    error.message?.toLowerCase().includes("unauthorized");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[--background] px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-xl bg-white/50 border border-[#518591]/20">
          <Image
            src="/logo.svg"
            alt=""
            width={48}
            height={48}
            className="h-20 w-20 object-contain"
            priority
          />
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold tracking-tight text-[--destructive]">
          {isForbidden ? "403" : "Error"}
        </h1>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[--foreground]">
            {isForbidden ? "Access Forbidden" : "Something Went Wrong"}
          </h2>
          <p className="text-sm text-[--muted-foreground]">
            {isForbidden 
              ? "You do not have permission to access this page." 
              : "An unexpected error occurred. Please try again later."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[--primary] px-4 py-2.5 text-sm font-medium text-[--primary-foreground] transition hover:bg-[--primary-hover]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[--border] bg-[--card] px-4 py-2.5 text-sm font-medium text-[--foreground] transition hover:bg-[--secondary]"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
