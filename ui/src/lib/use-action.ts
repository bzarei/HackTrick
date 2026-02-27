import { useCallback } from 'react';
import { Environment, ErrorManager } from '@novx/core';
import { useEnvironment } from '@novx/portal';


type AnyFn = (...args: any[]) => any;

export function useAction<T extends AnyFn>(fn: T) {
  return useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      try {
        const result = fn(...args);
        return result instanceof Promise ? await result : result;
      }
      catch (e) {
        useEnvironment().get(ErrorManager).handle(e);
        return undefined;
      }
    },
    [fn],
  );
}
