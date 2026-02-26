import { useState, useEffect, useContext } from 'react';
import { Command, InitialCommand, CommandInterceptor } from './command';
import { shortcutManager } from '../shortcut-manager';
import { GlobalInterceptorsContext } from './command-provider';

type UseCommandsOptions = {
  commands?: InitialCommand[];
  inherit?: Record<string, Command>;
  localInterceptors?: CommandInterceptor[];
};

export function useCommands({
  commands: commandsToRegister = [],
  inherit = {},
  localInterceptors = [],
}: UseCommandsOptions) {
  // Get global interceptors from provider
  const globalInterceptors = useContext(GlobalInterceptorsContext);

  // Combine global + local interceptors
  const allInterceptors = [...globalInterceptors, ...localInterceptors];

  const [commandRegistry, setCommandRegistry] = useState<Record<string, Command>>(() => {
    const all: Record<string, Command> = { ...inherit };
    commandsToRegister.forEach((c) => {
      const cmd = new Command(c);
      // Apply all interceptors (global + local)
      allInterceptors.forEach((i) => cmd.addInterceptor(i));
      all[c.name] = cmd;
    });
    return all;
  });

  // Register shortcuts
  useEffect(() => {
    Object.values(commandRegistry).forEach((cmd) =>
      shortcutManager.registerCommand(cmd),
    );
  }, [commandRegistry]);

  // Run a command by name
  const run = (name: string) => commandRegistry[name]?.run();

  // Enable/disable by name
  const setEnabled = (name: string, enabled: boolean) =>
    commandRegistry[name]?.setEnabled(enabled);

  // Query state
  const isEnabled = (name: string) => commandRegistry[name]?.state.enabled ?? false;
  const isRunning = (name: string) => commandRegistry[name]?.state.running ?? false;

  // **New `get` returns a callable function**
  const get = (name: string) => {
    if (!commandRegistry[name]) throw new Error(`Command "${name}" not found`);
    const fn = () => commandRegistry[name].run();
    // attach metadata if needed
    (fn as any).enabled = () => commandRegistry[name].state.enabled;
    (fn as any).running = () => commandRegistry[name].state.running;
    return fn;
  };

  return {
    get,
    getAll: () => Object.values(commandRegistry),
    add: (cmd: Command) =>
      setCommandRegistry((prev) => ({ ...prev, [cmd.name]: cmd })),
    run,
    setEnabled,
    isEnabled,
    isRunning,
  };
}
