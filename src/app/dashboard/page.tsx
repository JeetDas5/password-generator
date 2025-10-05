"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultKey } from "@/context/VaultKeyContext";
import VaultItemForm from "@/components/VaultItemForm";
import VaultTable from "@/components/VaultTable";
import VaultKeyPrompt from "@/components/VaultKeyPrompt";
import FolderManager from "@/components/FolderManager";
import ExportImport from "@/components/ExportImport";

export default function DashboardPage() {
  const vaultTableRef = useRef<{ refreshItems: () => void }>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
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
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your vault...</p>
        </div>
      </div>
    );
  }

  // Show vault key prompt if user is authenticated but vault key is missing
  if (!key) {
    return <VaultKeyPrompt />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Password Vault
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your passwords and secure notes
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Folder Manager */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📁 Folders
                </h3>
                <FolderManager 
                  onFolderSelect={setSelectedFolderId}
                  selectedFolderId={selectedFolderId}
                />
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ⚡ Quick Actions
                </h3>
                <div className="space-y-2">
                  <ExportImport onImportComplete={handleItemCreated} />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Add New Item Form */}
            <VaultItemForm onItemCreated={handleItemCreated} />

            {/* Vault Items Table */}
            <VaultTable 
              ref={vaultTableRef} 
              selectedFolderId={selectedFolderId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
