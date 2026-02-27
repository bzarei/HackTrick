import React, { createContext, useContext } from "react";
import { useCommands } from "./use-commands";
import { runningStateInterceptor, errorHandlingInterceptor } from "./command-interceptors";
import { CommandInterceptor, InitialCommand } from "./command";

type Props = {
  children: React.ReactNode;
  initialCommands?: InitialCommand[];
  localInterceptors?: CommandInterceptor[];
  handleError?: (e: unknown) => void;
};

// Global interceptors context - any useCommands() will automatically use these
export const GlobalInterceptorsContext = createContext<CommandInterceptor[]>([]);

export const CommandProvider: React.FC<Props> = ({ children, initialCommands, localInterceptors = [], handleError }) => {
  const globalInterceptors = [
    runningStateInterceptor(),
    ...(handleError ? [errorHandlingInterceptor(handleError)] : []),
    ...localInterceptors,
  ];

  useCommands({
    commands: initialCommands,
    localInterceptors: globalInterceptors,
  });

  return (
    <GlobalInterceptorsContext.Provider value={globalInterceptors}>
      {children}
    </GlobalInterceptorsContext.Provider>
  );
};

export const useGlobalInterceptors = () => useContext(GlobalInterceptorsContext);
