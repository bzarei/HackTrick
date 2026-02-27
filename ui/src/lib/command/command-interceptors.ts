import { Command, CommandInterceptor } from './command';
import { Environment, ErrorManager } from '@novx/core';

export const runningStateInterceptor = (): CommandInterceptor => {
  return async (cmd, next) => {
    if (cmd.state.running || !cmd.state.enabled) return;
    cmd.setRunning(true);
    try {
      await next();
    } finally {
      cmd.setRunning(false);
    }
  };
};

export const errorHandlingInterceptor = (
  handleError: (e: unknown) => void,
): CommandInterceptor => {
  return async (cmd, next) => {
    try {
      await next();
    } catch (e) {
      Environment.instance!.get(ErrorManager).handle(e);//)handleError(e);
    }
  };
};
