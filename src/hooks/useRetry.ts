import { useState, useCallback } from "react";

interface UseRetryOptions {
  maxRetries?: number;
  delay?: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

interface UseRetryReturn<T> {
  execute: () => Promise<T | null>;
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  reset: () => void;
}

/**
 * Hook for retrying async operations with exponential backoff.
 * Useful for network requests, data loading, etc.
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
): UseRetryReturn<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async (): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        setIsLoading(false);
        setRetryCount(0);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (attempt < maxRetries) {
          onRetry?.(attempt + 1);
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, attempt))
          );
        } else {
          setError(error);
          setRetryCount(attempt);
          setIsLoading(false);
          onMaxRetriesReached?.(error);
          return null;
        }
      }
    }

    setIsLoading(false);
    return null;
  }, [fn, maxRetries, delay, onRetry, onMaxRetriesReached]);

  const reset = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsLoading(false);
  }, []);

  return {
    execute,
    isLoading,
    error,
    retryCount,
    reset,
  };
}
