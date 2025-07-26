"use client";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { updateAnnouncement, deleteAnnouncement } from "../utils/database";
import { useModal } from "../utils/useModal";

export default function AnnouncementCard({ announcement, onUpdate, onDelete }) {
  const { userData } = useAuth();
  const { showConfirm, showAlert } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority || 'normal'
  });
  const [saving, setSaving] = useState(false);

  const canEdit = userData?.role === 'admin' || 
                  userData?.role === 'teacher' || 
                  announcement.createdBy === userData?.uid;

  const canDelete = userData?.role === 'admin' || 
                    userData?.role === 'teacher' || 
                    announcement.createdBy === userData?.uid;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAnnouncement(announcement.id, editData);
      onUpdate && onUpdate();
      setIsEditing(false);
      showAlert("Success", "Announcement updated successfully!");
    } catch (error) {
      console.error("Error updating announcement:", error);
      showAlert("Error", "Failed to update announcement. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirm(
      "Delete Announcement",
      "Are you sure you want to delete this announcement? This action cannot be undone.",
      async () => {
        try {
          await deleteAnnouncement(announcement.id);
          onDelete && onDelete();
          showAlert("Success", "Announcement deleted successfully!");
        } catch (error) {
          console.error("Error deleting announcement:", error);
          showAlert("Error", "Failed to delete announcement. Please try again.");
        }
      }
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString() + ' ' + timestamp.toDate().toLocaleTimeString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString();
    }
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50';
      case 'normal':
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'normal':
      default:
        return 'Normal Priority';
    }
  };

  if (isEditing) {
    return (
      <div className={`card p-4 ${getPriorityColor(editData.priority)}`}>
        <div className="space-y-3">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="input w-full font-semibold"
            placeholder="Announcement title"
          />
          
          <textarea
            value={editData.content}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            className="input w-full h-24 resize-none"
            placeholder="Announcement content"
          />
          
          <select
            value={editData.priority}
            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
            className="input w-full"
          >
            <option value="normal">Normal Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !editData.title.trim() || !editData.content.trim()}
              className="btn-primary text-sm"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="btn-outline text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-4 ${getPriorityColor(announcement.priority)}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">
            {announcement.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full bg-muted text-xs">
              {getPriorityText(announcement.priority)}
            </span>
            <span>•</span>
            <span>{formatDate(announcement.createdAt)}</span>
            {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
              <>
                <span>•</span>
                <span>Updated {formatDate(announcement.updatedAt)}</span>
              </>
            )}
          </div>
        </div>
        
        {(canEdit || canDelete) && (
          <div className="flex gap-1">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground p-1"
                title="Edit announcement"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-muted-foreground hover:text-red-500 p-1"
                title="Delete announcement"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
        {announcement.content}
      </div>
    </div>
  );
} 