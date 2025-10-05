"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import LoadingSpinner from "./ui/LoadingSpinner";

interface Folder {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

interface FolderManagerProps {
  onFolderSelect?: (folderId: string | null) => void;
  selectedFolderId?: string | null;
  showCreateButton?: boolean;
}

const FOLDER_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
];

const FOLDER_ICONS = ["📁", "🏢", "🏠", "💼", "🎯", "🔒", "⭐", "📚"];

export default function FolderManager({ 
  onFolderSelect, 
  selectedFolderId, 
  showCreateButton = true 
}: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
    icon: "📁"
  });

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
      toast.error("Failed to load folders");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      const response = await axios.post("/api/folders", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      setFolders([...folders, response.data.folder]);
      setShowCreateModal(false);
      setFormData({ name: "", color: "#3B82F6", icon: "📁" });
      toast.success("Folder created successfully");
    } catch (error) {
      toast.error("Failed to create folder");
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !formData.name.trim()) return;

    try {
      const response = await axios.put(`/api/folders/${editingFolder._id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      setFolders(folders.map(f => f._id === editingFolder._id ? response.data.folder : f));
      setEditingFolder(null);
      setFormData({ name: "", color: "#3B82F6", icon: "📁" });
      toast.success("Folder updated successfully");
    } catch (error) {
      toast.error("Failed to update folder");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure? Items in this folder will be moved to 'No Folder'.")) return;

    try {
      await axios.delete(`/api/folders/${folderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      setFolders(folders.filter(f => f._id !== folderId));
      if (selectedFolderId === folderId) {
        onFolderSelect?.(null);
      }
      toast.success("Folder deleted successfully");
    } catch (error) {
      toast.error("Failed to delete folder");
    }
  };

  const openEditModal = (folder: Folder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      color: folder.color,
      icon: folder.icon
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingFolder(null);
    setFormData({ name: "", color: "#3B82F6", icon: "📁" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Folder List */}
      <div className="space-y-2">
        {/* All Items */}
        <button
          onClick={() => onFolderSelect?.(null)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
            selectedFolderId === null
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          <span className="text-xl">📋</span>
          <span className="font-medium">All Items</span>
          <span className="ml-auto text-sm text-gray-500">
            {/* You could add count here */}
          </span>
        </button>

        {/* Folders */}
        {folders.map((folder) => (
          <div key={folder._id} className="group relative">
            <button
              onClick={() => onFolderSelect?.(folder._id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                selectedFolderId === folder._id
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="text-xl">{folder.icon}</span>
              <span className="font-medium">{folder.name}</span>
              <div 
                className="w-3 h-3 rounded-full ml-auto"
                style={{ backgroundColor: folder.color }}
              />
            </button>
            
            {/* Folder Actions */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(folder);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                title="Edit folder"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder._id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                title="Delete folder"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Folder Button */}
      {showCreateButton && (
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="ghost"
          className="w-full justify-start"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Folder
        </Button>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingFolder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingFolder ? "Edit Folder" : "Create New Folder"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter folder name"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FOLDER_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-2 text-lg rounded-lg border-2 transition-colors ${
                          formData.icon === icon
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FOLDER_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          formData.color === color
                            ? "border-gray-900 dark:border-white scale-110"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                  className="flex-1"
                >
                  {editingFolder ? "Update" : "Create"} Folder
                </Button>
                <Button variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}