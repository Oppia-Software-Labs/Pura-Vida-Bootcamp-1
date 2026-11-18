"use client";

import { useCallback, useRef, useState } from "react";

import type { StellarServiceErrorReason } from "@/lib/stellar/errors";

import { sendPayment } from "../services/payment";
import type { SendPaymentInput } from "../services/payment";
import type {
  PaymentError,
  PaymentErrorCode,
  PaymentFieldError,
  PaymentReceipt,
  PaymentStatus,
} from "../types";

export interface UsePaymentResult {
  status: PaymentStatus;
  error: PaymentError | null;
  receipt: PaymentReceipt | null;
  fieldErrors: PaymentFieldError | null;
  submit: (input: SendPaymentInput) => Promise<void>;
  reset: () => void;
}

interface PaymentState {
  status: PaymentStatus;
  error: PaymentError | null;
  receipt: PaymentReceipt | null;
  fieldErrors: PaymentFieldError | null;
}

const INITIAL_STATE: PaymentState = {
  status: "idle",
  error: null,
  receipt: null,
  fieldErrors: null,
};

function toPaymentError(
  reason: StellarServiceErrorReason,
  message: string,
): PaymentError {
  const code: PaymentErrorCode = reason === "network" ? "network" : "unknown";
  return { code, message };
}

/**
 * Owns one payment attempt at a time. `submit` never rejects: a failure is state,
 * because the form renders it and the page must stay interactive.
 */
export function usePayment({
  onSuccess,
}: {
  onSuccess: () => void;
}): UsePaymentResult {
  const [state, setState] = useState<PaymentState>(INITIAL_STATE);

  /** Synchronous lock: two clicks can land before React re-renders the button. */
  const inFlightRef = useRef(false);

  const submit = useCallback(
    async (input: SendPaymentInput) => {
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setState({ status: "signing", error: null, receipt: null, fieldErrors: null });

      try {
        const result = await sendPayment(input);

        if (!result.ok) {
          setState({
            status: "error",
            error: toPaymentError(result.error.reason, result.error.message),
            receipt: null,
            fieldErrors: null,
          });
          return;
        }

        setState({
          status: "success",
          error: null,
          receipt: result.data,
          fieldErrors: null,
        });

        onSuccess();
      } finally {
        inFlightRef.current = false;
      }
    },
    [onSuccess],
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    status: state.status,
    error: state.error,
    receipt: state.receipt,
    // Field-level validation runs before submit (`validatePayment`), so a rejected
    // payment only ever carries one message and no field to point at.
    fieldErrors: state.fieldErrors,
    submit,
    reset,
  };
}
