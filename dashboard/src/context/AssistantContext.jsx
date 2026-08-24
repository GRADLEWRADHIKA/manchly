import React, {createContext, useContext, useState, useCallback} from "react";

const AssistantContext = createContext(null);

export function AssistantProvider({children}){
    const [isOpen, setIsOpen] = useState(false);

   const toggle = useCallback(() => setIsOpen((o) => !o), []);
   const open = useCallback(() => setIsOpen(true), []);
   const close = useCallback(() => setIsOpen(false), []);
   
   return (
    <AssistantContext.Provider  value={{isOpen, toggle, open, close}}>
        {children}
    </AssistantContext.Provider>
   );
}

export function useAssistant(){
    const ctx = useContext(AssistantContext);
    if(!ctx){
        throw new Error("useAssistant must be used within an AssitantProider");
    }
    return ctx;
}