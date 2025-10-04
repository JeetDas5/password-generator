"use client";

import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { useVaultKey } from "@/context/VaultKeyContext";
import { decryptVaultItemFields, encryptVaultItemFields } from "@/lib/crypto";
import axios from "axios";
import toast from "react-hot-toast";

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
  username?: string | EncryptedField | null;
  password?: string | EncryptedField | null;
  url?: string | EncryptedField | null;
  notes?: string | EncryptedField | null;
};

const VaultTable = forwardRef<{ refreshItems: () => void }>((props, ref) => {
  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DecryptedVaultItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<DecryptedVaultItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    username: "",
    password: "",
    url: "",
    notes: "",
  });
  const { key } = useVaultKey();

  const fetchItems = useCallback(async () => {
    const res = await axios.get("/api/vault/get", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    if (res.status !== 200) {
      console.error("Failed to fetch vault items");
      return;
    }
    const data: VaultItem[] = res.data.vaultItems;

    if (!key) return;

    const decrypted = await Promise.all(
      data.map(async (item) => {
        try {
          const fields = await decryptVaultItemFields(key, item);
          return { ...item, ...fields };
        } catch (err) {
          console.error(
            `Failed to decrypt vault item ${item._id}:`,
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
  }, [key]);

  useEffect(() => {
    if (key) fetchItems();
  }, [key, fetchItems]);

  useImperativeHandle(ref, () => ({
    refreshItems: fetchItems,
  }));

  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) => {
        const title = typeof item.title === "string" ? item.title.toLowerCase() : "";
        const username = typeof item.username === "string" ? item.username.toLowerCase() : "";
        const url = typeof item.url === "string" ? item.url.toLowerCase() : "";
        const notes = typeof item.notes === "string" ? item.notes.toLowerCase() : "";

        return (
          title.includes(searchTerm.toLowerCase()) ||
          username.includes(searchTerm.toLowerCase()) ||
          url.includes(searchTerm.toLowerCase()) ||
          notes.includes(searchTerm.toLowerCase())
        );
      });
      setFilteredItems(filtered);
    }
  }, [items, searchTerm]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${fieldName} copied to clipboard!`);

      // Auto-clear clipboard after 30 seconds
      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
        } catch {
          console.log("Could not clear clipboard");
        }
      }, 30000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleEdit = (item: DecryptedVaultItem) => {
    setEditingItem(item);
    setEditForm({
      title: typeof item.title === "string" ? item.title : "",
      username: typeof item.username === "string" ? item.username : "",
      password: typeof item.password === "string" ? item.password : "",
      url: typeof item.url === "string" ? item.url : "",
      notes: typeof item.notes === "string" ? item.notes : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !key) return;

    try {
      const encryptedFields = await encryptVaultItemFields(key, {
        username: editForm.username,
        password: editForm.password,
        url: editForm.url,
        notes: editForm.notes,
      });

      await axios.put(`/api/vault/edit/${editingItem._id}`, {
        title: editForm.title,
        ...encryptedFields,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      toast.success("Item updated successfully!");
      setEditingItem(null);
      fetchItems(); // Refresh the list
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete(`/api/vault/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      toast.success("Item deleted successfully!");
      fetchItems(); // Refresh the list
    } catch {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="space-y-4 text-black">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search vault items..."
          className="w-full p-2 border rounded-md text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-full">
            <h3 className="text-lg font-bold mb-4">Edit Vault Item</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                className="w-full p-2 border rounded"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Username"
                className="w-full p-2 border rounded"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 border rounded"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
              <input
                type="text"
                placeholder="URL"
                className="w-full p-2 border rounded"
                value={editForm.url}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
              />
              <textarea
                placeholder="Notes"
                className="w-full p-2 border rounded"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vault Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Your Vault Items ({filteredItems.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left font-medium text-gray-700">Title</th>
                <th className="p-3 text-left font-medium text-gray-700">Username</th>
                <th className="p-3 text-left font-medium text-gray-700">Password</th>
                <th className="p-3 text-left font-medium text-gray-700">URL</th>
                <th className="p-3 text-left font-medium text-gray-700">Notes</th>
                <th className="p-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    {typeof item.title === "string" ? item.title : ""}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[100px]">
                        {typeof item.username === "string" ? item.username : ""}
                      </span>
                      {typeof item.username === "string" && item.username && (
                        <button
                          onClick={() => copyToClipboard(item.username as string, "Username")}
                          className="text-blue-600 hover:text-blue-800 text-sm p-1 rounded hover:bg-blue-50"
                          title="Copy username"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-600">
                        {typeof item.password === "string" && item.password ? "••••••••" : ""}
                      </span>
                      {typeof item.password === "string" && item.password && (
                        <button
                          onClick={() => copyToClipboard(item.password as string, "Password")}
                          className="text-blue-600 hover:text-blue-800 text-sm p-1 rounded hover:bg-blue-50"
                          title="Copy password"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[120px] text-blue-600">
                        {typeof item.url === "string" ? item.url : ""}
                      </span>
                      {typeof item.url === "string" && item.url && (
                        <>
                          <button
                            onClick={() => copyToClipboard(item.url as string, "URL")}
                            className="text-blue-600 hover:text-blue-800 text-sm p-1 rounded hover:bg-blue-50"
                            title="Copy URL"
                          >
                            📋
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 text-sm p-1 rounded hover:bg-green-50"
                            title="Open URL"
                          >
                            🔗
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[100px] text-gray-600">
                        {typeof item.notes === "string" ? item.notes : ""}
                      </span>
                      {typeof item.notes === "string" && item.notes && (
                        <button
                          onClick={() => copyToClipboard(item.notes as string, "Notes")}
                          className="text-blue-600 hover:text-blue-800 text-sm p-1 rounded hover:bg-blue-50"
                          title="Copy notes"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700"
                        title="Edit item"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700"
                        title="Delete item"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          No items match your search criteria.
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No vault items found. Create your first item!
        </div>
      )}
    </div>
  );
});

VaultTable.displayName = "VaultTable";

export default VaultTable;
