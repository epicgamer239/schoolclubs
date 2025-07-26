"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import Modal from "../../../components/Modal";
import { useModal } from "../../../utils/useModal";

export default function AdminTagsManager() {
  const [tags, setTags] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [editingTagId, setEditingTagId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const { modalState, showConfirm, showAlert, closeModal, handleConfirm } = useModal();

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.schoolId) return;

      const q = query(collection(firestore, "tags"), where("schoolId", "==", userData.schoolId));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setTags(list);
      setFiltered(list);
    };

    if (!authLoading && userData) {
      fetchData();
    }
  }, [userData, authLoading]);

  const handleCreateTag = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!newTagName.trim()) {
      showAlert("Error", "Tag name is required.");
      setLoading(false);
      return;
    }

    try {
      // Check for duplicate tag names in the same school
      const existingTagsQuery = query(
        collection(firestore, "tags"),
        where("schoolId", "==", userData.schoolId),
        where("name", "==", newTagName.trim())
      );
      const existingTagsSnapshot = await getDocs(existingTagsQuery);
      
      if (!existingTagsSnapshot.empty) {
        showAlert("Error", "A tag with this name already exists in your school.");
        setLoading(false);
        return;
      }

      const tagData = {
        name: newTagName.trim(),
        description: newTagDescription.trim(),
        color: newTagColor,
        schoolId: userData.schoolId,
        createdBy: userData.uid,
        createdAt: serverTimestamp(),
        usageCount: 0,
      };

      await addDoc(collection(firestore, "tags"), tagData);

      // Reset form and close modal
      setNewTagName("");
      setNewTagDescription("");
      setNewTagColor("#3B82F6");
      setShowCreateModal(false);

      // Refresh tags
      const q = query(collection(firestore, "tags"), where("schoolId", "==", userData.schoolId));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTags(list);
      setFiltered(list);

      showAlert("Success", "Tag created successfully!");
    } catch (err) {
      console.error("Error creating tag:", err);
      showAlert("Error", "Something went wrong while creating the tag.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Delete Tag",
      "Are you sure you want to delete this tag? This action cannot be undone.",
      async () => {
        await deleteDoc(doc(firestore, "tags", id));
        setTags((prev) => prev.filter((t) => t.id !== id));
        setFiltered((prev) => prev.filter((t) => t.id !== id));
        showAlert("Success", "Tag deleted successfully!");
      }
    );
  };

  const handleEdit = (id) => {
    setEditingTagId(id);
  };

  const handleSaveEdit = async (id, name, description, color) => {
    try {
      await updateDoc(doc(firestore, "tags", id), { 
        name: name.trim(), 
        description: description.trim(),
        color: color,
        updatedAt: serverTimestamp()
      });
      setEditingTagId(null);
      setTags((prev) =>
        prev.map((tag) => (tag.id === id ? { ...tag, name: name.trim(), description: description.trim(), color } : tag))
      );
      setFiltered((prev) =>
        prev.map((tag) => (tag.id === id ? { ...tag, name: name.trim(), description: description.trim(), color } : tag))
      );
      showAlert("Success", "Tag updated successfully!");
    } catch (error) {
      console.error("Error updating tag:", error);
      showAlert("Error", "Failed to update tag.");
    }
  };

  const applyFilters = (text) => {
    let filteredTags = tags;

    // Apply text search
    if (text) {
      filteredTags = filteredTags.filter((t) => 
        t.name.toLowerCase().includes(text.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(text.toLowerCase()))
      );
    }

    setFiltered(filteredTags);
  };

  const handleSearch = (text) => {
    setSearch(text);
    applyFilters(text);
  };



  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Admin Dashboard" />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Tags</h1>
              <p className="text-muted-foreground mt-2">Create and manage tags for clubs</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Tag
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tags..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="input pl-10"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Tags List */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Tags Found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {search 
                    ? `No tags match your search "${search}".` 
                    : "No tags have been created yet."}
                </p>
                {(search) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setFiltered(tags);
                    }}
                    className="btn-primary"
                  >
                    Clear Search
                  </button>
                )}
                {!search && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                  >
                    Create Your First Tag
                  </button>
                )}
              </div>
            ) : (
              filtered.map((tag) => (
                <div key={tag.id} className="card p-6 hover:shadow-lg transition-shadow">
                  {editingTagId === tag.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <input
                          value={tag.name}
                          onChange={(e) =>
                            setFiltered((prev) =>
                              prev.map((t) => (t.id === tag.id ? { ...t, name: e.target.value } : t))
                            )
                          }
                          className="input flex-1"
                          placeholder="Tag name"
                        />
                        <input
                          type="color"
                          value={tag.color}
                          onChange={(e) =>
                            setFiltered((prev) =>
                              prev.map((t) => (t.id === tag.id ? { ...t, color: e.target.value } : t))
                            )
                          }
                          className="w-12 h-10 rounded border border-border"
                        />
                      </div>
                      <textarea
                        value={tag.description}
                        onChange={(e) =>
                          setFiltered((prev) =>
                            prev.map((t) => (t.id === tag.id ? { ...t, description: e.target.value } : t))
                          )
                        }
                        className="input h-24 resize-none"
                        placeholder="Tag description"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(tag.id, tag.name, tag.description, tag.color)}
                          className="btn-primary"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingTagId(null)}
                          className="btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: tag.color }}
                          ></div>
                          <div>
                            <h3 className="text-lg font-semibold">{tag.name}</h3>
                            {tag.description && (
                              <p className="text-muted-foreground">{tag.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{tag.usageCount || 0} clubs using this tag</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(tag.id)}
                            className="btn-outline"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id)}
                            className="btn-destructive"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Tag Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Create New Tag</h2>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Tag Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Science, Sports, Arts"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Description
                </label>
                <textarea
                  placeholder="Optional description for this tag"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  className="input h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Color
                </label>
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-full h-12 rounded border border-border"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Tag"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </ProtectedRoute>
  );
} 