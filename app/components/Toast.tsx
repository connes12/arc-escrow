"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: "success" | "error", message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: "success" | "error", message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-[calc(100%-2rem)] pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const isSuccess = toast.type === "success";

  return (
    <div
      onClick={onClose}
      className={`pointer-events-auto bg-[#E8EDE0] p-4 rounded-xl shadow-lg border-2 flex items-start gap-3 cursor-pointer select-none transition-all duration-300 transform translate-x-0 animate-slideIn max-w-md w-full ${
        isSuccess ? "border-[#123C2D]" : "border-[#A63A2B]"
      }`}
    >
      {/* Icon */}
      {isSuccess ? (
        <div className="flex-shrink-0 mt-0.5 text-[#123C2D]">
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <div className="flex-shrink-0 mt-0.5 text-[#A63A2B]">
          <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      )}

      {/* Message */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-xs font-bold uppercase tracking-wider ${isSuccess ? "text-[#123C2D]" : "text-[#A63A2B]"}`}>
          {isSuccess ? "Success" : "Transaction Failed"}
        </h4>
        <p className="text-sm text-[#18201C] mt-0.5 font-medium leading-relaxed break-words pr-2">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-[#18201C]/40 hover:text-[#18201C] transition-colors self-start mt-0.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Parses wallet/contract errors into human-readable error messages.
 */
export function parseTxError(error: any): string {
  const message = error?.message || String(error);

  // 1. User rejected request
  if (
    message.includes("User rejected") ||
    message.includes("user rejected") ||
    message.includes("User denied") ||
    message.includes("Rejected") ||
    error?.code === 4001
  ) {
    return "Transaction was rejected in your wallet.";
  }

  // 2. Insufficient funds (gas or native balances)
  if (
    message.includes("insufficient funds") ||
    message.includes("exceeds the balance of the account") ||
    message.includes("INSUFFICIENT_FUNDS") ||
    message.includes("exceeds balance")
  ) {
    return "Insufficient funds. Please ensure you have enough USDC (gas is paid in native USDC on Arc Testnet).";
  }

  // 3. Insufficient allowance / amount exceeds allowance
  if (
    message.includes("allowance") ||
    message.includes("allowance too low") ||
    message.includes("amount exceeds allowance")
  ) {
    return "Insufficient USDC allowance. Please approve USDC first.";
  }

  // 4. Fallback/Parse Viem descriptive details if available
  if (message.includes("Details:")) {
    const detailsMatch = message.match(/Details: ([^\n]+)/);
    if (detailsMatch && detailsMatch[1]) {
      return detailsMatch[1].trim();
    }
  }

  if (message.includes("Short Message:")) {
    const shortMatch = message.match(/Short Message: ([^\n]+)/);
    if (shortMatch && shortMatch[1]) {
      return shortMatch[1].trim();
    }
  }

  // Truncate overly long technical messages
  return message.length > 150 ? `${message.slice(0, 150)}...` : message;
}
