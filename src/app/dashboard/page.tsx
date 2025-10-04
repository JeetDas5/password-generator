"use client";

import VaultItemForm from "@/components/VaultItemForm";
import VaultTable from "@/components/VaultTable";

export default function DashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Vault Dashboard</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-1">
          <VaultItemForm />
        </div>
        <div className="col-span-1">
          <VaultTable />
        </div>
      </div>
    </main>
  );
}
