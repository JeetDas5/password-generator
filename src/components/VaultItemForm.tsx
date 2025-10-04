"use client";

import { useState } from "react";
import { useVaultKey } from "@/context/VaultKeyContext";
import { encryptVaultItemFields } from "@/lib/crypto";
import toast from "react-hot-toast";
import axios from "axios";

interface VaultItemFormProps {
  onItemCreated?: () => void;
}

export default function VaultItemForm({ onItemCreated }: VaultItemFormProps) {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { key } = useVaultKey();

  const clearForm = () => {
    setTitle("");
    setUsername("");
    setPassword("");
    setUrl("");
    setNotes("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) {
      toast.error("No encryption key loaded. Please log in again.");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);

    try {
      const encryptedFields = await encryptVaultItemFields(key, {
        username,
        password,
        url,
        notes,
      });

      const res = await axios.post("/api/vault/create", {
        title,
        ...encryptedFields,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (res.status === 201) {
        toast.success("Item saved securely!");
        clearForm();
        onItemCreated?.(); // Refresh the table
      } else {
        toast.error("Failed to save item");
      }
    } catch {
      toast.error("Failed to save item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 text-black">
      <h2 className="text-xl font-semibold mb-4">Add New Vault Item</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="text"
          placeholder="Title *"
          className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Username"
          className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="relative">
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
              const length = 16;
              let result = "";
              for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              setPassword(result);
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Gen
          </button>
        </div>
        <input
          type="url"
          placeholder="URL"
          className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <textarea
          placeholder="Notes"
          className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 text-white p-3 rounded-md cursor-pointer hover:bg-green-700 disabled:opacity-50 flex-1 font-medium"
          >
            {isLoading ? "Saving..." : "Save Item"}
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="bg-gray-600 text-white p-3 rounded-md cursor-pointer hover:bg-gray-700 font-medium"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
