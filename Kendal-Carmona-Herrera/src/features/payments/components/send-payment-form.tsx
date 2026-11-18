"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { StateMessage } from "@/components/feedback/state-message";
import { Button, buttonVariants } from "@/components/ui/button";
import { shortenAddress } from "@/lib/format";
import { MEMO_TEXT_MAX_BYTES } from "@/lib/stellar/constants";

import { usePayment } from "../hooks/use-payment";
import { maxSendableXlm, validatePaymentFields } from "../services/validation";
import type { PaymentFieldError } from "../types";

const SURFACE =
  "rounded-xl border border-border bg-card text-card-foreground p-5 space-y-4";

const FIELD_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

const LABEL_CLASS = "block text-sm font-medium";

const HINT_CLASS = "text-xs text-muted-foreground";

const ERROR_CLASS = "text-xs text-destructive";

const TEXT_ENCODER = new TextEncoder();

export interface SendPaymentFormProps {
  address: string;
  networkPassphrase: string;
  spendableXlm: string | null;
  /** Runs after every payment attempt, failed or not, so balances can be re-read. */
  onSettled: () => void;
}

export function SendPaymentForm({
  address,
  networkPassphrase,
  spendableXlm,
  onSettled,
}: SendPaymentFormProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [fieldErrors, setFieldErrors] = useState<PaymentFieldError[]>([]);

  const payment = usePayment({ onSettled });

  const isPending =
    payment.status === "signing" || payment.status === "submitting";

  const memoBytes = TEXT_ENCODER.encode(memo).length;

  const maxAmount = spendableXlm === null ? null : maxSendableXlm(spendableXlm);

  const errorFor = (field: PaymentFieldError["field"]): string | null =>
    fieldErrors.find((error) => error.field === field)?.message ?? null;

  const clearError = (field: PaymentFieldError["field"]) => {
    setFieldErrors((current) =>
      current.some((error) => error.field === field)
        ? current.filter((error) => error.field !== field)
        : current,
    );
  };

  const handleReset = () => {
    payment.reset();
    setFieldErrors([]);
    setDestination("");
    setAmount("");
    setMemo("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending || spendableXlm === null) return;

    const errors = validatePaymentFields({
      destination,
      amount,
      memo,
      spendableXlm,
    });

    setFieldErrors(errors);

    if (errors.length > 0) return;

    void payment.submit({
      sourceAddress: address,
      destination,
      amount,
      memo,
      networkPassphrase,
      spendableXlm,
    });
  };

  const receipt = payment.receipt;

  if (payment.status === "success" && receipt !== null) {
    const memoNote =
      receipt.memo === null ? "" : ` Memo "${receipt.memo}".`;

    return (
      <section className={SURFACE}>
        <h2 className="text-base font-semibold">Send XLM</h2>
        <StateMessage
          tone="success"
          title={`Sent ${receipt.amount} XLM`}
          description={`To ${shortenAddress(receipt.destination)}.${memoNote}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={receipt.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View on Stellar Expert
            </a>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Send another
            </Button>
          </div>
        </StateMessage>
      </section>
    );
  }

  const destinationError = errorFor("destination");
  const amountError = errorFor("amount");
  const memoError = errorFor("memo");

  const submitLabel =
    payment.status === "signing"
      ? "Waiting for your wallet…"
      : payment.status === "submitting"
        ? "Submitting…"
        : "Send XLM";

  return (
    <section className={SURFACE}>
      <div>
        <h2 className="text-base font-semibold">Send XLM</h2>
        <p className={`mt-1 ${HINT_CLASS}`}>
          Testnet only. Signing happens in your wallet.
        </p>
      </div>

      {payment.error === null ? null : (
        <StateMessage
          tone="error"
          title="Payment not sent"
          description={payment.error.message}
        />
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1">
          <label className={LABEL_CLASS} htmlFor="payment-destination">
            Destination
          </label>
          <input
            id="payment-destination"
            className={FIELD_CLASS}
            type="text"
            value={destination}
            autoComplete="off"
            spellCheck={false}
            placeholder="G…"
            aria-invalid={destinationError === null ? undefined : true}
            aria-describedby={
              destinationError === null ? undefined : "payment-destination-error"
            }
            onChange={(event) => {
              setDestination(event.target.value);
              clearError("destination");
            }}
          />
          {destinationError === null ? null : (
            <p id="payment-destination-error" className={ERROR_CLASS} role="alert">
              {destinationError}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className={LABEL_CLASS} htmlFor="payment-amount">
            Amount
          </label>
          <div className="flex gap-2">
            <input
              id="payment-amount"
              className={FIELD_CLASS}
              type="text"
              inputMode="decimal"
              value={amount}
              autoComplete="off"
              spellCheck={false}
              placeholder="0.00"
              aria-invalid={amountError === null ? undefined : true}
              aria-describedby={
                amountError === null ? undefined : "payment-amount-error"
              }
              onChange={(event) => {
                setAmount(event.target.value);
                clearError("amount");
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              disabled={maxAmount === null || isPending}
              onClick={() => {
                if (maxAmount === null) return;
                setAmount(maxAmount);
                clearError("amount");
              }}
            >
              Max
            </Button>
          </div>
          {amountError === null ? null : (
            <p id="payment-amount-error" className={ERROR_CLASS} role="alert">
              {amountError}
            </p>
          )}
          {spendableXlm === null ? (
            <p className={HINT_CLASS}>
              The spendable balance is still loading.
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className={LABEL_CLASS} htmlFor="payment-memo">
            Memo <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="payment-memo"
            className={FIELD_CLASS}
            type="text"
            value={memo}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={memoError === null ? undefined : true}
            aria-describedby={
              memoError === null ? "payment-memo-counter" : "payment-memo-error"
            }
            onChange={(event) => {
              setMemo(event.target.value);
              clearError("memo");
            }}
          />
          {memoError === null ? (
            <p id="payment-memo-counter" className={HINT_CLASS}>
              {memoBytes}/{MEMO_TEXT_MAX_BYTES} bytes
            </p>
          ) : (
            <p id="payment-memo-error" className={ERROR_CLASS} role="alert">
              {memoError}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || spendableXlm === null}
        >
          {submitLabel}
        </Button>
      </form>
    </section>
  );
}
