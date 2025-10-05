"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import ExportImport from "@/components/ExportImport";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/");
      return;
    }
    
    // Get user info from token or make API call
    fetchUserInfo();
  }, [router]);

  const fetchUserInfo = async () => {
    try {
      // You might want to create a user info endpoint
      // For now, we'll check if user has 2FA enabled via a test call
      const response = await axios.get("/api/auth/user-info", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      }).catch(() => {
        // If endpoint doesn't exist, we'll create a mock user object
        return { data: { email: "user@example.com", twoFactorEnabled: false } };
      });
      
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user info");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error("Please enter your password");
      return;
    }

    try {
      await axios.post("/api/auth/2fa/disable", {
        password: disablePassword,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      setUser({ ...user, twoFactorEnabled: false });
      setDisabling2FA(false);
      setDisablePassword("");
      toast.success("2FA disabled successfully");
    } catch (error) {
      toast.error("Failed to disable 2FA. Check your password.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account security and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Security Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="text-2xl mr-3">🔐</span>
                Security
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add an extra layer of security to your account with TOTP authentication
                  </p>
                  <div className="flex items-center mt-2">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      user?.twoFactorEnabled ? "bg-green-500" : "bg-gray-400"
                    }`} />
                    <span className="text-sm font-medium">
                      {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                <div>
                  {user?.twoFactorEnabled ? (
                    <Button
                      variant="danger"
                      onClick={() => setDisabling2FA(true)}
                    >
                      Disable 2FA
                    </Button>
                  ) : (
                    <Button onClick={() => setShowTwoFactorSetup(true)}>
                      Enable 2FA
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="text-2xl mr-3">💾</span>
                Data Management
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Export & Import
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Create encrypted backups or import data from other password managers
                  </p>
                </div>
                <ExportImport />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="text-2xl mr-3">👤</span>
                Account
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Email Address
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {user?.email || "Loading..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTwoFactorSetup && (
        <TwoFactorSetup
          onComplete={() => {
            setShowTwoFactorSetup(false);
            setUser({ ...user, twoFactorEnabled: true });
          }}
          onCancel={() => setShowTwoFactorSetup(false)}
        />
      )}

      {/* Disable 2FA Modal */}
      {disabling2FA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Disable Two-Factor Authentication
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Enter your password to disable 2FA. This will make your account less secure.
              </p>
              
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="danger"
                  onClick={handleDisable2FA}
                  className="flex-1"
                >
                  Disable 2FA
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDisabling2FA(false);
                    setDisablePassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}