import { Environment } from '@novx/core'
import React, { createContext, useContext } from 'react'

export const EnvironmentContext = createContext<Environment | null>(null)

export function useEnvironment(): Environment {
  const environment = useContext(EnvironmentContext)
  if (!environment) {
    throw new Error('Environment not provided')
  }
  
  return environment
}

type Constructor<T> = new (...args: any[]) => T

export function useInject<T extends readonly Constructor<any>[]>(
  ...types: T
): { [K in keyof T]: T[K] extends Constructor<infer R> ? R : never } {
  const env = useEnvironment()

  return React.useMemo(
    () => types.map((t) => env.get(t)),
    [env]
  ) as { [K in keyof T]: T[K] extends Constructor<infer R> ? R : never }
}