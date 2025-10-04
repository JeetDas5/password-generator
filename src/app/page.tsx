
"use client";
import { useState } from "react";
import AuthForm from "@/components/AuthForm";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const router = useRouter();

  return (
    <main className="h-screen flex flex-col justify-center items-center bg-gray-100">
      <AuthForm
        type={mode}
        onSuccess={() => router.push("/dashboard")}
      />
      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-4 text-blue-600 underline"
      >
        {mode === "login"
          ? "Don't have an account? Register"
          : "Already have an account? Login"}
      </button>
    </main>
  );
}
