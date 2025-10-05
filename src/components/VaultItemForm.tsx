"use client";

import { useState, useEffect } from "react";
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
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string>("");
  const [favorite, setFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [newTag, setNewTag] = useState("");
  const { key } = useVaultKey();

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await axios.get("/api/folders", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setFolders(response.data.folders);
    } catch (error) {
      console.error("Failed to fetch folders");
    }
  };

  const clearForm = () => {
    setTitle("");
    setUsername("");
    setPassword("");
    setUrl("");
    setNotes("");
    setTags([]);
    setFolderId("");
    setFavorite(false);
    setNewTag("");
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const length = 16;
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    toast.success("Strong password generated!");
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
        tags,
        folderId: folderId && folderId !== "" ? folderId : null,
        favorite,
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-6">
        <div className="text-2xl mr-3">➕</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Item</h2>
      </div>
      
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            placeholder="e.g., Gmail, Facebook, Work Email"
            className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username / Email
          </label>
          <input
            type="text"
            placeholder="Enter username or email"
            className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter or generate password"
              className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-24 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                title="Generate strong password"
                disabled={isLoading}
              >
                🎲
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Website URL
          </label>
          <input
            type="url"
            placeholder="https://example.com"
            className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            placeholder="Additional notes or security questions..."
            className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Folder
          </label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={isLoading}
          >
            <option value="">No Folder</option>
            {folders.map((folder) => (
              <option key={folder._id} value={folder._id}>
                {folder.icon} {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a tag..."
                className="flex-1 border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newTag.trim() && !tags.includes(newTag.trim())) {
                      setTags([...tags, newTag.trim()]);
                      setNewTag("");
                    }
                  }
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => {
                  if (newTag.trim() && !tags.includes(newTag.trim())) {
                    setTags([...tags, newTag.trim()]);
                    setNewTag("");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                disabled={isLoading || !newTag.trim()}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, i) => i !== index))}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="favorite"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            checked={favorite}
            onChange={(e) => setFavorite(e.target.checked)}
            disabled={isLoading}
          />
          <label htmlFor="favorite" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            ⭐ Mark as favorite
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white p-3 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              "💾 Save Item"
            )}
          </button>
          <button
            type="button"
            onClick={clearForm}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
