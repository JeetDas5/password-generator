"use client";

import { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import LoadingSpinner from "./ui/LoadingSpinner";

interface ExportImportProps {
  onImportComplete?: () => void;
}

export default function ExportImport({ onImportComplete }: ExportImportProps) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [exportPassword, setExportPassword] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!exportPassword) {
      toast.error("Please enter an export password");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "/api/vault/export",
        {
          exportPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      // Create and download the file
      const blob = new Blob(
        [JSON.stringify(response.data.exportData, null, 2)],
        {
          type: "application/json",
        }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Vault exported successfully!");
      setExportPassword("");
      setShowModal(false);
    } catch (error) {
      toast.error("Failed to export vault");
      if (axios.isAxiosError(error) && error.response) {
        console.error("Export error response:", error.response.data);
      } else if (error instanceof Error) {
        console.error("Export error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile || !importPassword) {
      toast.error("Please select a file and enter the import password");
      return;
    }

    setLoading(true);
    try {
      const fileContent = await importFile.text();
      const encryptedData = JSON.parse(fileContent);

      const response = await axios.post(
        "/api/vault/import",
        {
          encryptedData,
          importPassword,
          mergeMode: true,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      toast.success(
        `Import completed! ${response.data.imported.folders} folders and ${response.data.imported.items} items imported.`
      );
      setImportPassword("");
      setImportFile(null);
      setShowModal(false);
      onImportComplete?.();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 400) {
          toast.error(
            error.response.data.message || "Invalid import file or password"
          );
        } else {
          console.error("Import error response:", error.response.data);
        }
      } else if (error instanceof Error) {
        console.error("Import error:", error.message);
      }
      toast.error("Failed to import vault");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        setImportFile(file);
      } else {
        toast.error("Please select a valid JSON file");
        event.target.value = "";
      }
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="ghost"
        className="w-full justify-start"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        Export / Import
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Export / Import Vault
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("export")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "export"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  📤 Export
                </button>
                <button
                  onClick={() => setActiveTab("import")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "import"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  📥 Import
                </button>
              </div>

              {activeTab === "export" ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Export Your Vault
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      Create an encrypted backup of all your passwords, folders,
                      and settings. The export will be protected with a password
                      you choose.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Export Password
                    </label>
                    <input
                      type="password"
                      placeholder="Choose a strong password for the export file"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Remember this password - you&apos;ll need it to import the file
                      later
                    </p>
                  </div>

                  <Button
                    onClick={handleExport}
                    disabled={loading || !exportPassword}
                    className="w-full"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : null}
                    📤 Export Vault
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                      Import Vault Data
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                      Import an encrypted vault export file. This will merge
                      with your existing data.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Export File
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        {importFile ? importFile.name : "Choose File"}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Import Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter the export password"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={loading || !importFile || !importPassword}
                    className="w-full"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : null}
                    📥 Import Vault
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
