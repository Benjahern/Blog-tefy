import { useState } from 'react'

export function useLocalPreference<T extends string>(key: string, initial: T, allowed: readonly T[]) {
  void key
  void allowed
  return useState<T>(initial)
}
