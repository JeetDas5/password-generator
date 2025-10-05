"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultKey } from "@/context/VaultKeyContext";
import VaultItemForm from "@/components/VaultItemForm";
import VaultTable from "@/components/VaultTable";
import VaultKeyPrompt from "@/components/VaultKeyPrompt";

export default function DashboardPage() {
  const vaultTableRef = useRef<{ refreshItems: () => void }>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { key } = useVaultKey();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/");
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  const handleItemCreated = () => {
    vaultTableRef.current?.refreshItems();
  };

  if (!isAuthenticated) {
    return <div className="p-6">Loading...</div>;
  }

  // Show vault key prompt if user is authenticated but vault key is missing
  if (!key) {
    return <VaultKeyPrompt />;
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    // Clear the vault key from memory for security
    // Note: The key will be cleared when the component unmounts anyway
    router.push("/");
  };

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Password Vault</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <VaultItemForm onItemCreated={handleItemCreated} />
        </div>
        <div className="lg:col-span-2">
          <VaultTable ref={vaultTableRef} />
        </div>
      </div>
    </main>
  );
}
