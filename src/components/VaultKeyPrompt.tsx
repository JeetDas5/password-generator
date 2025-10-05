"use client";

import { useState } from "react";
import { useVaultKey } from "@/context/VaultKeyContext";
import axios from "axios";
import toast from "react-hot-toast";

export default function VaultKeyPrompt() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { derive } = useVaultKey();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "/api/auth/verify-password",
        { password },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status !== 200) {
        toast.error("Invalid password");
        return;
      }

      const { salt } = res.data;

      await derive(password, salt);
      setPassword(""); // Clear password from memory
      toast.success("Vault unlocked!");
    } catch (error) {
      console.error("Failed to unlock vault:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Invalid password");
      } else {
        toast.error("Failed to unlock vault");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Unlock Your Vault
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your password to decrypt and access your secure vault items.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-6">
            <div>
              <label
                htmlFor="unlock-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="unlock-password"
                type="password"
                placeholder="Enter your password"
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-4 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </div>
              ) : (
                "🔓 Unlock Vault"
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                  Security Notice
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Your vault is encrypted with your password. We cannot recover
                  your data if you forget it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
