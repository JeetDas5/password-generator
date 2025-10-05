"use client";

import {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
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
  tags: string[];
  folderId?: string;
  favorite: boolean;
};

type EncryptedField = { ciphertext: string; iv: number[] };

type DecryptedVaultItem = {
  _id: string;
  title: string | EncryptedField | null;
  username?: string | EncryptedField | null;
  password?: string | EncryptedField | null;
  url?: string | EncryptedField | null;
  notes?: string | EncryptedField | null;
  tags: string[];
  folderId?: string;
  favorite: boolean;
};

interface VaultTableProps {
  selectedFolderId?: string | null;
}

const VaultTable = forwardRef<{ refreshItems: () => void }, VaultTableProps>(
  ({ selectedFolderId }, ref) => {
    const [items, setItems] = useState<DecryptedVaultItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<DecryptedVaultItem[]>(
      []
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [editingItem, setEditingItem] = useState<DecryptedVaultItem | null>(
      null
    );
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

            // Normalize folderId
            let folderIdStr: string | undefined = undefined;
            if (item.folderId) {
              if (typeof item.folderId === "string") {
                folderIdStr = item.folderId;
              } else if (typeof item.folderId === "object") {
                const anyFolder = item.folderId as {
                  _id?: { toString: () => string } | string;
                  toString?: () => string;
                };
                if (anyFolder._id) {
                  folderIdStr =
                    typeof anyFolder._id === "string"
                      ? anyFolder._id
                      : anyFolder._id.toString();
                } else if (typeof anyFolder.toString === "function") {
                  folderIdStr = anyFolder.toString();
                }
              }
            }

            return {
              ...item,
              ...fields,
              folderId: folderIdStr,
            };
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

    // Filter items based on search term and folder
    useEffect(() => {
      let filtered = items;

      if (selectedFolderId !== null) {
        filtered = filtered.filter((item) => {
          const itemFolderId = item.folderId?.toString() || null;
          return itemFolderId === selectedFolderId;
        });
      }

      if (searchTerm) {
        filtered = filtered.filter((item) => {
          const title =
            typeof item.title === "string" ? item.title.toLowerCase() : "";
          const username =
            typeof item.username === "string"
              ? item.username.toLowerCase()
              : "";
          const url =
            typeof item.url === "string" ? item.url.toLowerCase() : "";
          const notes =
            typeof item.notes === "string" ? item.notes.toLowerCase() : "";

          return (
            title.includes(searchTerm.toLowerCase()) ||
            username.includes(searchTerm.toLowerCase()) ||
            url.includes(searchTerm.toLowerCase()) ||
            notes.includes(searchTerm.toLowerCase())
          );
        });
      }

      setFilteredItems(filtered);
    }, [items, searchTerm, selectedFolderId]);

    const copyToClipboard = async (text: string, fieldName: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(`${fieldName} copied to clipboard!`);

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

        await axios.put(
          `/api/vault/edit/${editingItem._id}`,
          {
            title: editForm.title,
            ...encryptedFields,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        toast.success("Item updated successfully!");
        setEditingItem(null);
        fetchItems();
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
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          console.error("Error deleting item:", error.response.data);
        } else if (error instanceof Error) {
          console.error("Error deleting item:", error.message);
        }
        toast.error("Failed to delete item");
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search vault items..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Edit Vault Item
                  </h3>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Title"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={editForm.url}
                    onChange={(e) =>
                      setEditForm({ ...editForm, url: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="Notes"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Vault Items
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {filteredItems.length}{" "}
                  {filteredItems.length === 1 ? "item" : "items"} found
                </p>
              </div>
              <div className="text-2xl">🔐</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </th>
                  <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </th>
                  <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </th>
                  <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">
                    URL
                  </th>
                  <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">
                    Tags
                  </th>
                  <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {item.favorite && (
                          <span className="text-yellow-500">⭐</span>
                        )}
                        <div className="font-medium text-gray-900 dark:text-white">
                          {typeof item.title === "string" ? item.title : ""}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[120px] text-gray-700 dark:text-gray-300">
                          {typeof item.username === "string"
                            ? item.username
                            : ""}
                        </span>
                        {typeof item.username === "string" && item.username && (
                          <button
                            onClick={() =>
                              copyToClipboard(
                                item.username as string,
                                "Username"
                              )
                            }
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Copy username"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-600 dark:text-gray-400">
                          {typeof item.password === "string" && item.password
                            ? "••••••••"
                            : ""}
                        </span>
                        {typeof item.password === "string" && item.password && (
                          <button
                            onClick={() =>
                              copyToClipboard(
                                item.password as string,
                                "Password"
                              )
                            }
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Copy password"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[140px] text-blue-600 dark:text-blue-400">
                          {typeof item.url === "string" ? item.url : ""}
                        </span>
                        {typeof item.url === "string" && item.url && (
                          <>
                            <button
                              onClick={() =>
                                copyToClipboard(item.url as string, "URL")
                              }
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Copy URL"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                              title="Open URL"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {item.tags && item.tags.length > 0 ? (
                          item.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg text-sm transition-colors"
                          title="Edit item"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg text-sm transition-colors"
                          title="Delete item"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No matches found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No items match your search criteria. Try a different search term.
            </p>
          </div>
        )}

        {items.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Your vault is empty
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Create your first password entry to get started with SecureVault.
            </p>
          </div>
        )}
      </div>
    );
  }
);

VaultTable.displayName = "VaultTable";

export default VaultTable;
