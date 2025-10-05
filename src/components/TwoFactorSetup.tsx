"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import LoadingSpinner from "./ui/LoadingSpinner";

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/2fa/setup", {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      setQrCode(response.data.qrCode);
      setSecret(response.data.manualEntryKey);
      setStep("verify");
    } catch (error) {
      toast.error("Failed to setup 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/2fa/verify", {
        code: verificationCode,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      setBackupCodes(response.data.backupCodes);
      toast.success("2FA enabled successfully!");
      onComplete();
    } catch (error) {
      toast.error("Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  if (step === "setup") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Enable Two-Factor Authentication
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  What you'll need:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• An authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>• Your smartphone or tablet</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSetup}
                disabled={loading}
                className="flex-1"
              >
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Continue
              </Button>
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Scan QR Code
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Use your authenticator app to scan this QR code
            </p>
          </div>

          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Can't scan? Enter this code manually:
              </p>
              <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border font-mono break-all">
                {secret}
              </code>
            </div>

            {/* Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter the 6-digit code from your app:
              </label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg font-mono"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {backupCodes.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                  Backup Codes
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-400 mb-3">
                  Save these codes in a safe place. You can use them to access your account if you lose your device.
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1"
            >
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Verify & Enable
            </Button>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}