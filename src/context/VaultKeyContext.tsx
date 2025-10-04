"use client";

import React, { createContext, useContext, useState } from "react";
import { deriveKeyFromPassword, base64ToSalt } from "@/lib/crypto";

type VaultKeyContextType = {
  key: CryptoKey | null;
  derive: (password: string, saltBase64: string) => Promise<CryptoKey>;
  clear: () => void;
};

const VaultKeyContext = createContext<VaultKeyContextType | undefined>(
  undefined
);

export function VaultKeyProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<CryptoKey | null>(null);

  const derive = async (password: string, saltBase64: string) => {
    if (typeof saltBase64 !== 'string' || saltBase64.length === 0) {
      throw new Error(`derive expected a base64 salt string but got: ${String(saltBase64)}`);
    }
    const salt = base64ToSalt(saltBase64);
    const derivedKey = await deriveKeyFromPassword(password, salt);
    setKey(derivedKey);
    return derivedKey;
  };

  const clear = () => setKey(null);

  return (
    <VaultKeyContext.Provider value={{ key, derive, clear }}>
      {children}
    </VaultKeyContext.Provider>
  );
}

export const useVaultKey = () => {
  const ctx = useContext(VaultKeyContext);
  if (!ctx) throw new Error("useVaultKey must be used within VaultKeyProvider");
  return ctx;
};
