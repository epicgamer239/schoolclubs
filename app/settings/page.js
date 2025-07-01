"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { firestore, storage } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/firebase";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../components/AuthContext";
import DashboardTopBar from "../../components/DashboardTopBar";
import Image from "next/image";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Profile picture state
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setEmail(userData.email || "");
    }
  }, [userData]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!userData?.uid) {
        setError("User not found. Please try again.");
        return;
      }

      const updateData = {};
      
      // Only update display name if it changed
      if (displayName.trim() !== userData.displayName) {
        updateData.displayName = displayName.trim();
      }

      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(firestore, "users", userData.uid), updateData);
        setSuccess("Profile updated successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("No changes detected.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Please fill in all password fields.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }

      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError("User not found. Please try again.");
        return;
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setSuccess("Password updated successfully!");
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else if (error.code === "auth/weak-password") {
        setError("New password is too weak. Please choose a stronger password.");
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!currentPassword || !email.trim()) {
        setError("Please fill in all fields.");
        return;
      }

      if (email.trim() === userData.email) {
        setError("New email is the same as current email.");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError("User not found. Please try again.");
        return;
      }

      // Re-authenticate user before changing email
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, email.trim());

      // Update in Firestore
      await updateDoc(doc(firestore, "users", userData.uid), {
        email: email.trim()
      });

      setSuccess("Email updated successfully! Please check your new email for verification.");
      
      // Clear form
      setCurrentPassword("");
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (error) {
      console.error("Error updating email:", error);
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else if (error.code === "auth/email-already-in-use") {
        setError("Email is already in use by another account.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Failed to update email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Profile picture functions
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setShowPhotoOptions(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setError("Could not access camera. Please try uploading a file instead.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setPreviewImage(blob);
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size must be less than 5MB.");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file.");
        return;
      }
      
      setPreviewImage(file);
      setShowPhotoOptions(false);
    }
  };

  const uploadProfilePicture = async () => {
    if (!previewImage || !userData?.uid) return;
    
    setUploadingPhoto(true);
    setError("");
    
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `profile-pictures/${userData.uid}_${timestamp}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Upload the image
      await uploadBytes(storageRef, previewImage);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user profile in Firestore
      await updateDoc(doc(firestore, "users", userData.uid), {
        photoURL: downloadURL
      });
      
      setSuccess("Profile picture updated successfully!");
      setPreviewImage(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      setError("Failed to upload profile picture. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const resetToDefault = async () => {
    if (!userData?.uid) return;
    
    setUploadingPhoto(true);
    setError("");
    
    try {
      // Get the original Google profile picture URL
      const user = auth.currentUser;
      let defaultPhotoURL = "";
      
      if (user?.photoURL) {
        // Use the Google profile picture with the reliable format
        defaultPhotoURL = user.photoURL.includes('lh3.googleusercontent.com') ? 
          user.photoURL.replace(/=s\d+-c$/, '=s400-c') : user.photoURL;
      }
      
      // Update user profile in Firestore
      await updateDoc(doc(firestore, "users", userData.uid), {
        photoURL: defaultPhotoURL
      });
      
      setSuccess("Profile picture reset to default!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error resetting profile picture:", error);
      setError("Failed to reset profile picture. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const cancelPhotoUpdate = () => {
    setPreviewImage(null);
    setShowPhotoOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (authLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
          <DashboardTopBar title="Settings" />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Settings" />
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account information and security settings</p>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg mb-6">
              {success}
            </div>
          )}

          {/* Profile Information */}
          <div className="card p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Profile Information</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  disabled
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Use the email change section below to update your email address
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </form>
          </div>

          {/* Profile Picture Management */}
          <div className="card p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Profile Picture</h2>
            
            <div className="space-y-6">
              {/* Current Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {userData?.photoURL ? (
                    <Image
                      src={userData.photoURL}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full border-2 border-border"
                      unoptimized
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-xl font-semibold border-2 border-border">
                      {getInitials(userData?.displayName || userData?.email)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Current Picture</h3>
                  <p className="text-sm text-muted-foreground">
                    {userData?.photoURL ? "Custom profile picture" : "Default profile picture"}
                  </p>
                </div>
              </div>

              {/* Photo Options */}
              {!showCamera && !previewImage && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                    className="btn-outline w-full"
                  >
                    Change Profile Picture
                  </button>
                  
                  {userData?.photoURL && (
                    <button
                      onClick={resetToDefault}
                      disabled={uploadingPhoto}
                      className="btn-secondary w-full disabled:opacity-50"
                    >
                      {uploadingPhoto ? "Resetting..." : "Reset to Default"}
                    </button>
                  )}
                </div>
              )}

              {/* Photo Options Modal */}
              {showPhotoOptions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-background rounded-xl p-6 max-w-md w-full border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Choose Photo Source</h3>
                    
                    <div className="space-y-3">
                      <button
                        onClick={startCamera}
                        className="w-full btn-primary flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Take Photo with Camera
                      </button>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full btn-outline flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload from Device
                      </button>
                      
                      <button
                        onClick={() => setShowPhotoOptions(false)}
                        className="w-full btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Camera Interface */}
              {showCamera && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
                  <div className="bg-background rounded-xl p-6 max-w-lg w-full border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Take Photo</h3>
                    
                    <div className="relative mb-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg border border-border"
                        onLoadedMetadata={() => {
                          if (videoRef.current) {
                            videoRef.current.play();
                          }
                        }}
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={capturePhoto}
                        className="flex-1 btn-primary"
                      >
                        Capture Photo
                      </button>
                      <button
                        onClick={stopCamera}
                        className="flex-1 btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview and Upload */}
              {previewImage && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-foreground mb-3">Preview</h3>
                    <div className="inline-block">
                      <Image
                        src={URL.createObjectURL(previewImage)}
                        alt="Preview"
                        width={120}
                        height={120}
                        className="w-30 h-30 rounded-full border-2 border-border"
                        unoptimized
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={uploadProfilePicture}
                      disabled={uploadingPhoto}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                    </button>
                    <button
                      onClick={cancelPhotoUpdate}
                      disabled={uploadingPhoto}
                      className="flex-1 btn-secondary disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="card p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Change Password</h2>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input w-full"
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Change Email */}
          <div className="card p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Change Email Address</h2>
            
            <form onSubmit={handleUpdateEmail} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  New Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter new email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Change Email"}
                </button>
              </div>
            </form>
          </div>

          {/* Account Information */}
          <div className="card p-8">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Account Information</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">Account Type</span>
                <span className="text-sm text-foreground capitalize">{userData?.role || "Unknown"}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">Account Created</span>
                <span className="text-sm text-foreground">
                  {userData?.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : "Unknown"}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">User ID</span>
                <span className="text-sm text-foreground font-mono">{userData?.uid || "Unknown"}</span>
              </div>

              {userData?.schoolId && (
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm font-medium text-muted-foreground">School ID</span>
                  <span className="text-sm text-foreground font-mono">{userData.schoolId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 