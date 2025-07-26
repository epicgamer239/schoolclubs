"use client";
import { useEffect } from "react";

export default function Modal({ isOpen, onClose = () => { console.log('onClose called'); }, onConfirm, title, message, type = "confirm", children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose && onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { console.log('Backdrop clicked'); onClose(); }}
        data-testid="modal-backdrop"
        aria-label="Close modal"
        tabIndex={-1}
      />
      {/* Modal */}
      <div
        className="relative bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        data-testid="modal-content"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <button
            onClick={() => { console.log('Close button clicked'); onClose(); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6" data-testid="modal-body">
          {children ? children : <p className="text-muted-foreground">{message}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {type === "confirm" && (
            <button
              onClick={() => { console.log('Cancel button clicked'); onClose(); }}
              className="btn-outline"
            >
              Cancel
            </button>
          )}
          <button
            onClick={type === "confirm" ? onConfirm : onClose}
            className={`btn-primary ${type === "alert" ? "w-full" : ""}`}
          >
            {type === "confirm" ? "Confirm" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
} 