"use client";

import { useState } from "react";
import { useVaultKey } from "@/context/VaultKeyContext";
import axios from "axios";
import toast from "react-hot-toast";

export default function AuthForm({
  type,
  onSuccess,
}: {
  type: "login" | "register";
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { derive } = useVaultKey();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await axios.post(`/api/auth/${type}`, { email, password });

    if (![200, 201].includes(res.status)) {
      toast.error(res.data.message || `${type} failed`);
      return;
    }

    const { token, salt } = res.data;

    // Store token in localStorage (or cookie)
    if (token) localStorage.setItem("authToken", token);

    // Ensure salt was returned by the server
    if (typeof salt !== "string" || salt.length === 0) {
      console.error("Auth response missing salt:", res.data);
      toast.error("Auth succeeded but vault salt is missing. Cannot derive vault key.");
      return;
    }

    // Derive and store vault key in memory
    await derive(password, salt);

    toast.success(`${type === 'login' ? 'Login' : 'Registration'} successful!`);

    // Notify parent (e.g. home page) to redirect to dashboard
    onSuccess();
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="Email"
        className="border p-2 text-black"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 text-black"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" className="bg-blue-600 text-white p-2 cursor-pointer">
        {type === 'login' ? 'Login' : 'Register'}
      </button>
    </form>
  );
}
