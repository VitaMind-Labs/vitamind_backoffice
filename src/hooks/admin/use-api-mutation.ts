"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { invalidateQueries } from "./use-api-query";

interface MutationOptions<TVars, TResult> {
  /** Toast shown on success (string or builder). Omit for silent success. */
  successMessage?: string | ((result: TResult, vars: TVars) => string);
  /** Resource names whose queries become stale on success. */
  invalidate?: string[];
  onSuccess?: (result: TResult, vars: TVars) => void;
  onError?: (error: ApiError, vars: TVars) => void;
  /** Override the error toast title; the backend message is kept as description. */
  errorTitle?: string;
}

export function describeApiError(error: ApiError): { title: string; description?: string } {
  if (error.isNotImplemented) {
    return {
      title: "Not available yet",
      description: `${error.message} No data was changed.`,
    };
  }
  if (error.isConflict) return { title: "Action no longer possible", description: error.message };
  if (error.isForbidden) return { title: "Not permitted", description: error.message };
  return { title: "Something went wrong", description: error.message };
}

export function useApiMutation<TVars, TResult = unknown>(
  mutationFn: (vars: TVars) => Promise<TResult>,
  options: MutationOptions<TVars, TResult> = {},
) {
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const optionsRef = useRef(options);
  const fnRef = useRef(mutationFn);
  useEffect(() => {
    optionsRef.current = options;
    fnRef.current = mutationFn;
  });

  const mutate = useCallback(
    async (vars: TVars): Promise<TResult | undefined> => {
      const opts = optionsRef.current;
      setPending(true);
      setError(null);
      try {
        const result = await fnRef.current(vars);
        if (opts.invalidate?.length) invalidateQueries(...opts.invalidate);
        if (opts.successMessage) {
          toast.success(typeof opts.successMessage === "function" ? opts.successMessage(result, vars) : opts.successMessage);
        }
        opts.onSuccess?.(result, vars);
        return result;
      } catch (caught) {
        const apiError = caught instanceof ApiError ? caught : new ApiError((caught as Error)?.message ?? "Unexpected error", 0);
        setError(apiError);
        if (!apiError.isUnauthorized) {
          const { title, description } = describeApiError(apiError);
          const show = apiError.isNotImplemented ? toast.warning : toast.error;
          show(opts.errorTitle ?? title, { description });
        }
        opts.onError?.(apiError, vars);
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  return { mutate, isPending, error, reset: () => setError(null) };
}
