
"use client";
import { useState } from "react";
import AuthForm from "@/components/AuthForm";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Your Passwords,
          <span className="text-blue-600 dark:text-blue-400"> Secured</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          End-to-end encrypted password manager that keeps your digital life safe and organized.
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">End-to-End Encrypted</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your data is encrypted before it leaves your device</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Lightning Fast</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Quick access to all your passwords and secure notes</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🌐</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Cross-Platform</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Access your vault from anywhere, anytime</p>
          </div>
        </div>
      </div>

      {/* Auth Form */}
      <AuthForm
        type={mode}
        onSuccess={() => router.push("/dashboard")}
      />
      
      {/* Toggle Auth Mode */}
      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-6 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
      >
        {mode === "login"
          ? "Don't have an account? Create one"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
