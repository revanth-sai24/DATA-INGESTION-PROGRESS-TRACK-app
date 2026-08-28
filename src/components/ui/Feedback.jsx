"use client";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button, Modal, ToastViewport, useToasts } from "./Components";

/**
 * App-wide confirmations and toasts.
 *
 * Destructive actions asked with `window.confirm`, which cannot be styled,
 * cannot say more than one line, and looks like a browser error rather than
 * part of the app. Toasts existed as a primitive but were never mounted, so
 * every outcome — success or failure — was silent or an `alert`.
 *
 * `confirm()` returns a promise resolving true/false, so call sites read
 * almost the same as before:
 *
 *   if (!(await confirm({ title: "Delete this task?" }))) return;
 */

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const { toasts, push, dismiss } = useToasts();
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    ({
      title,
      description,
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      danger = false,
    }) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog({ title, description, confirmLabel, cancelLabel, danger });
      }),
    [],
  );

  const settle = (answer) => {
    setDialog(null);
    resolver.current?.(answer);
    resolver.current = null;
  };

  const toast = useCallback(
    (message, tone = "info") => push(message, { tone }),
    [push],
  );

  return (
    <FeedbackContext.Provider value={{ confirm, toast }}>
      {children}

      <Modal
        open={!!dialog}
        onClose={() => settle(false)}
        title={dialog?.title}
        description={dialog?.description}
        size="sm"
        footer={
          <>
            <Button onClick={() => settle(false)}>{dialog?.cancelLabel}</Button>
            <Button
              variant={dialog?.danger ? "danger" : "primary"}
              onClick={() => settle(true)}
            >
              {dialog?.confirmLabel}
            </Button>
          </>
        }
      >
        {null}
      </Modal>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </FeedbackContext.Provider>
  );
}

/**
 * Falls back to the browser dialogs when used outside the provider, so a
 * component rendered on its own still works rather than throwing.
 */
export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  return (
    ctx ?? {
      confirm: async ({ title, description }) =>
        window.confirm([title, description].filter(Boolean).join("\n\n")),
      toast: (message) => console.info(message),
    }
  );
}
