import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const DialogContext = createContext(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: options.type || 'info',
        title: options.title || (options.type === 'error' ? 'Notice' : options.type === 'success' ? 'Success' : 'Notice'),
        message,
        confirmText: options.confirmText || 'OK',
        cancelText: null,
        onConfirm: () => {
          setDialogState(null);
          resolve(true);
        },
        onCancel: () => {
          setDialogState(null);
          resolve(false);
        }
      });
    });
  }, []);

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: options.type || 'warning',
        title: options.title || 'Please Confirm',
        message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          setDialogState(null);
          resolve(true);
        },
        onCancel: () => {
          setDialogState(null);
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialogState && dialogState.isOpen && (
        <ModalDialog {...dialogState} />
      )}
    </DialogContext.Provider>
  );
}

function ModalDialog({
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (cancelText && onCancel) {
          onCancel();
        } else if (onConfirm) {
          onConfirm();
        }
      } else if (e.key === 'Enter') {
        if (onConfirm) onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelText, onCancel, onConfirm]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={24} color="#10b981" />;
      case 'error':
      case 'danger':
        return <AlertCircle size={24} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={24} color="#f59e0b" />;
      case 'info':
      default:
        return <Info size={24} color="#2563eb" />;
    }
  };

  const getConfirmStyle = () => {
    if (type === 'danger' || type === 'error') {
      return { background: '#ef4444', color: '#ffffff' };
    }
    if (type === 'success') {
      return { background: '#10b981', color: '#ffffff' };
    }
    if (type === 'warning') {
      return { background: '#f59e0b', color: '#ffffff' };
    }
    return { background: '#2563eb', color: '#ffffff' };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (cancelText && onCancel) onCancel();
          else if (onConfirm) onConfirm();
        }
      }}
    >
      <div
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
          maxWidth: '460px',
          width: '100%',
          overflow: 'hidden',
          animation: 'scaleIn 0.15s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.25rem 0.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem'
          }}
        >
          <div
            style={{
              padding: '8px',
              borderRadius: '50%',
              background:
                type === 'success'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : type === 'danger' || type === 'error'
                  ? 'rgba(239, 68, 68, 0.12)'
                  : type === 'warning'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(37, 99, 235, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {getIcon()}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-main, #0f172a)'
              }}
            >
              {title}
            </h3>
            <div
              style={{
                marginTop: '0.5rem',
                fontSize: '0.925rem',
                lineHeight: 1.5,
                color: 'var(--text-muted, #475569)',
                whiteSpace: 'pre-line'
              }}
            >
              {message}
            </div>
          </div>
          <button
            type="button"
            onClick={cancelText && onCancel ? onCancel : onConfirm}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.25rem 1.25rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.65rem'
          }}
        >
          {cancelText && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              style={{
                padding: '0.55rem 1.15rem',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              ...getConfirmStyle()
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
