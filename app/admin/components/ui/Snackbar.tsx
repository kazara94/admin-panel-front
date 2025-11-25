'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/app/admin/lib/utils/cn';

interface Snackbar {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface SnackbarContextType {
  snackbars: Snackbar[];
  addSnackbar: (snackbar: Omit<Snackbar, 'id'>) => void;
  removeSnackbar: (id: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbars, setSnackbars] = useState<Snackbar[]>([]);

  const removeSnackbar = useCallback((id: string) => {
    setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
  }, []);

  const addSnackbar = useCallback((snackbar: Omit<Snackbar, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSnackbar = { ...snackbar, id };
    
    setSnackbars(prev => [...prev, newSnackbar]);

    const duration = snackbar.duration || 5000;
    setTimeout(() => {
      removeSnackbar(id);
    }, duration);
  }, [removeSnackbar]);

  return (
    <SnackbarContext.Provider value={{ snackbars, addSnackbar, removeSnackbar }}>
      {children}
      <SnackbarContainer snackbars={snackbars} onRemove={removeSnackbar} />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

function SnackbarContainer({ 
  snackbars, 
  onRemove 
}: { 
  snackbars: Snackbar[]; 
  onRemove: (id: string) => void;
}) {
  if (snackbars.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {snackbars.map((snackbar) => (
        <SnackbarItem key={snackbar.id} snackbar={snackbar} onRemove={onRemove} />
      ))}
    </div>
  );
}

function SnackbarItem({ 
  snackbar, 
  onRemove 
}: { 
  snackbar: Snackbar; 
  onRemove: (id: string) => void;
}) {
  const typeClasses = {
    success: 'bg-green text-white',
    error: 'bg-error text-white',
    warning: 'bg-orange text-white',
    info: 'bg-blue text-white',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn(
        'flex items-center px-4 py-3 rounded-lg shadow-lg animate-slide-up max-w-sm',
        typeClasses[snackbar.type]
      )}
    >
      <span className="mr-3 text-lg">{icons[snackbar.type]}</span>
      <p className={cn(
        "flex-1 text-sm font-medium",
        snackbar.type === 'error' && "text-red-200"
      )}>{snackbar.message}</p>
      <button
        onClick={() => onRemove(snackbar.id)}
        className="ml-3 text-lg hover:opacity-75 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}

