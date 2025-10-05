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
            // Verify password and get salt from the server
            const res = await axios.post("/api/auth/verify-password",
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

            // Derive the vault key (we know the password is correct now)
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-w-full">
                <h3 className="text-lg font-bold mb-4 text-black">Unlock Your Vault</h3>
                <p className="text-gray-600 mb-4">
                    Please enter your login password to decrypt and access your vault items.
                </p>
                <form onSubmit={handleUnlock} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Enter your password"
                        className="w-full p-2 border rounded text-black"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? "Verifying..." : "Unlock Vault"}
                    </button>
                </form>
            </div>
        </div>
    );
}