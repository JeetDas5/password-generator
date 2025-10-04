"use client";

import { useRef } from "react";
import VaultItemForm from "@/components/VaultItemForm";
import VaultTable from "@/components/VaultTable";

export default function DashboardPage() {
  const vaultTableRef = useRef<{ refreshItems: () => void }>(null);

  const handleItemCreated = () => {
    vaultTableRef.current?.refreshItems();
  };

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Password Vault</h1>
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
