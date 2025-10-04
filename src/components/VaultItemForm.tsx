"use client";

import { useState } from "react";
import { useVaultKey } from "@/context/VaultKeyContext";
import { encryptVaultItemFields } from "@/lib/crypto";
import toast from "react-hot-toast";
import axios from "axios";

export default function VaultItemForm() {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const { key } = useVaultKey();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) {
      toast.error("No encryption key loaded. Please log in again.");
      return;
    }

    const encryptedFields = await encryptVaultItemFields(key, {
      username,
      password,
      url,
      notes,
    });

    const res = await axios.post("/api/vault/create", {
      title,
      ...encryptedFields,
    },{
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    });

    if (res.status === 201) {
      toast.success("Item saved securely!");
    } else {
      toast.error("Failed to save item");
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Title"
        className="border p-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Username"
        className="border p-2"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="text"
        placeholder="URL"
        className="border p-2"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <textarea
        placeholder="Notes"
        className="border p-2"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        type="submit"
        className="bg-green-600 text-white p-2 cursor-pointer"
      >
        Save
      </button>
    </form>
  );
}
