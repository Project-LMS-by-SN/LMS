import { useCallback, useRef, useState } from "react";

/**
 * Prevents double-clicks / rapid duplicate execution of async actions.
 * A synchronous ref blocks same-tick / pre-render double clicks immediately,
 * while React state updates buttons to disabled with loading feedback.
 */
export function useSubmitLock() {
  const lockRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runWithLock = useCallback(async (action) => {
    if (lockRef.current) return undefined;
    lockRef.current = true;
    setIsSubmitting(true);
    try {
      return await action();
    } finally {
      lockRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, runWithLock, lockRef };
}

export default useSubmitLock;

