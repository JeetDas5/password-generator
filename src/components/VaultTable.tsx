"use client";

import { useEffect, useState } from "react";
import { useVaultKey } from "@/context/VaultKeyContext";
import { decryptVaultItemFields } from "@/lib/crypto";
import axios from "axios";

type VaultItem = {
  _id: string;
  title: string;
  username?: { ciphertext: string; iv: number[] };
  password?: { ciphertext: string; iv: number[] };
  url?: { ciphertext: string; iv: number[] };
  notes?: { ciphertext: string; iv: number[] };
};

type EncryptedField = { ciphertext: string; iv: number[] };

type DecryptedVaultItem = {
  _id: string;
  title: string | EncryptedField | null;
  // A field may be the original encrypted object (from server), or the decrypted string, or null if decryption failed.
  username?: string | EncryptedField | null;
  password?: string | EncryptedField | null;
  url?: string | EncryptedField | null;
  notes?: string | EncryptedField | null;
};

export default function VaultTable() {
  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const { key } = useVaultKey();

  useEffect(() => {
    const fetchItems = async () => {
      const res = await axios.get("/api/vault/get",
        {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        }
      );
      if (res.status !== 200) {
        console.error("Failed to fetch vault items");
        return;
      }
      const data: VaultItem[] = res.data.vaultItems;

      if (!key) return; // wait until key is ready

      const decrypted = await Promise.all(
        data.map(async (item) => {
          try {
            const fields = await decryptVaultItemFields(key, item);
            return { ...item, ...fields };
          } catch (err) {
            // decryptVaultItemFields should already catch decrypt failures per-field,
            // but guard here in case of unexpected errors. Return item with null fields.
            console.error(`Failed to decrypt vault item ${item._id}:`,
              err instanceof Error ? err.message : String(err)
            );
            return {
              ...item,
              username: null,
              password: null,
              url: null,
              notes: null,
            };
          }
        })
      );

      setItems(decrypted);
    };

    if (key) fetchItems();
  }, [key]);

  return (
    <table className="w-full border">
      <thead>
        <tr className="bg-gray-200 text-black">
          <th className="p-2">Title</th>
          <th className="p-2">Username</th>
          <th className="p-2">Password</th>
          <th className="p-2">URL</th>
          <th className="p-2">Notes</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item._id} className="border-t">
            <td className="p-2">{typeof item.title === 'string' ? item.title : ""}</td>
            <td className="p-2">{typeof item.username === 'string' ? item.username : ""}</td>
            <td className="p-2">{typeof item.password === 'string' ? item.password : ""}</td>
            <td className="p-2">{typeof item.url === 'string' ? item.url : ""}</td>
            <td className="p-2">{typeof item.notes === 'string' ? item.notes : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
