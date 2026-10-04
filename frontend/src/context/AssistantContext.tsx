import React, {createContext, useContext, useState, useCallback, ReactNode} from 'react';

type AssistantContextType = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

const AssistantContext = createContext<AssistantContextType | null>(null);

export function AssistantProvider({children}: {children: ReactNode}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen(o => !o), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AssistantContext.Provider value={{isOpen, toggle, open, close}}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant(): AssistantContextType {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return ctx;
}