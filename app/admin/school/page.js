"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";

export default function SchoolManagementPage() {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [schoolName, setSchoolName] = useState("");
  const [schoolDescription, setSchoolDescription] = useState("");
  const [studentJoinType, setStudentJoinType] = useState("code"); // "code" or "manual"
  const [teacherJoinType, setTeacherJoinType] = useState("code"); // "code" or "manual"
  const [maxClubsPerStudent, setMaxClubsPerStudent] = useState("");
  const [maxStudentsPerClub, setMaxStudentsPerClub] = useState("");
  const [allowStudentCreatedClubs, setAllowStudentCreatedClubs] = useState(false);
  const [requireTeacherApproval, setRequireTeacherApproval] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [authorizedAdmins, setAuthorizedAdmins] = useState([]);

  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!userData?.schoolId) return;

      try {
        const schoolDoc = await getDoc(doc(firestore, "schools", userData.schoolId));
        if (!schoolDoc.exists()) {
          setError("School not found.");
          setLoading(false);
          return;
        }

        const schoolData = schoolDoc.data();
        setSchool({ id: userData.schoolId, ...schoolData });
        
        // Set form values
        setSchoolName(schoolData.name || "");
        setSchoolDescription(schoolData.description || "");
        setStudentJoinType(schoolData.studentJoinType || "code");
        setTeacherJoinType(schoolData.teacherJoinType || "code");
        setMaxClubsPerStudent(schoolData.maxClubsPerStudent || "");
        setMaxStudentsPerClub(schoolData.maxStudentsPerClub || "");
        setAllowStudentCreatedClubs(schoolData.allowStudentCreatedClubs || false);
        setRequireTeacherApproval(schoolData.requireTeacherApproval !== false); // Default to true
        setAuthorizedAdmins(schoolData.authorizedAdminEmails || []);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching school:", error);
        setError("Failed to load school data.");
        setLoading(false);
      }
    };

    if (!authLoading && userData) {
      fetchSchoolData();
    }
  }, [userData, authLoading]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updateData = {
        name: schoolName.trim(),
        description: schoolDescription.trim(),
        studentJoinType,
        teacherJoinType,
        allowStudentCreatedClubs,
        requireTeacherApproval,
      };

      // Only add numeric fields if they're set and valid
      if (maxClubsPerStudent && !isNaN(maxClubsPerStudent) && parseInt(maxClubsPerStudent) > 0) {
        updateData.maxClubsPerStudent = parseInt(maxClubsPerStudent);
      }

      if (maxStudentsPerClub && !isNaN(maxStudentsPerClub) && parseInt(maxStudentsPerClub) > 0) {
        updateData.maxStudentsPerClub = parseInt(maxStudentsPerClub);
      }

      await updateDoc(doc(firestore, "schools", userData.schoolId), updateData);
      
      setSuccess("School settings updated successfully!");
      setSchool(prev => ({ ...prev, ...updateData }));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating school:", error);
      setError("Failed to update school settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addAuthorizedAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }

    const email = newAdminEmail.trim().toLowerCase();
    if (authorizedAdmins.includes(email)) {
      setError("This email is already authorized.");
      return;
    }

    try {
      const updatedAdmins = [...authorizedAdmins, email];
      
      // Save to database immediately
      await updateDoc(doc(firestore, "schools", school.id), {
        authorizedAdminEmails: updatedAdmins
      });

      // Update local state
      setAuthorizedAdmins(updatedAdmins);
      setNewAdminEmail("");
      setError(null);
      setSuccess("Admin email added successfully!");
    } catch (error) {
      console.error("Error adding authorized admin:", error);
      setError("Failed to add admin email. Please try again.");
    }
  };

  const removeAuthorizedAdmin = async (emailToRemove) => {
    try {
      const updatedAdmins = authorizedAdmins.filter(email => email !== emailToRemove);
      
      // Save to database immediately
      await updateDoc(doc(firestore, "schools", school.id), {
        authorizedAdminEmails: updatedAdmins
      });

      // Update local state
      setAuthorizedAdmins(updatedAdmins);
      setSuccess("Admin email removed successfully!");
    } catch (error) {
      console.error("Error removing authorized admin:", error);
      setError("Failed to remove admin email. Please try again.");
    }
  };

  const regenerateJoinCodes = async () => {
    if (!school) return;

    setSaving(true);
    setError(null);

    try {
      const newStudentCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newTeacherCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      await updateDoc(doc(firestore, "schools", school.id), {
        studentJoinCode: newStudentCode,
        teacherJoinCode: newTeacherCode
      });

      setSchool({
        ...school,
        studentJoinCode: newStudentCode,
        teacherJoinCode: newTeacherCode
      });

      setSuccess("Join codes regenerated successfully!");
    } catch (error) {
      console.error("Error regenerating join codes:", error);
      setError("Failed to regenerate join codes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="max-w-2xl mx-auto">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl">
              {error}
            </div>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="mt-4 btn-outline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Admin Dashboard" />
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mb-6 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🏫 School Management</h1>
          
          {school && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">{school.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Student Join Code: </span>
                  <code className="bg-muted px-3 py-2 rounded-lg text-sm font-mono border border-border">{school.studentJoinCode}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Teacher Join Code: </span>
                  <code className="bg-muted px-3 py-2 rounded-lg text-sm font-mono border border-border">{school.teacherJoinCode}</code>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/20 text-success p-4 rounded-xl mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="card p-8">
            <div className="space-y-8">
              {/* Basic School Information */}
              <div>
                <h3 className="text-xl font-semibold mb-6 text-foreground">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-foreground">
                      School Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter school name"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 text-foreground">
                      School Description
                    </label>
                    <textarea
                      placeholder="Describe your school..."
                      value={schoolDescription}
                      onChange={(e) => setSchoolDescription(e.target.value)}
                      className="input h-24 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <h3 className="text-xl font-semibold mb-6 text-foreground">Privacy & Join Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-4 text-foreground">
                      Student Join Method
                    </label>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="studentJoinType"
                          value="code"
                          checked={studentJoinType === "code"}
                          onChange={(e) => setStudentJoinType(e.target.value)}
                          className="text-primary"
                        />
                        <div>
                          <span className="text-foreground font-medium">Join with Code</span>
                          <p className="text-sm text-muted-foreground">Students can join using the student join code</p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="studentJoinType"
                          value="manual"
                          checked={studentJoinType === "manual"}
                          onChange={(e) => setStudentJoinType(e.target.value)}
                          className="text-primary"
                        />
                        <div>
                          <span className="text-foreground font-medium">Manual Approval</span>
                          <p className="text-sm text-muted-foreground">Students must be manually added by admin</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-4 text-foreground">
                      Teacher Join Method
                    </label>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="teacherJoinType"
                          value="code"
                          checked={teacherJoinType === "code"}
                          onChange={(e) => setTeacherJoinType(e.target.value)}
                          className="text-primary"
                        />
                        <div>
                          <span className="text-foreground font-medium">Join with Code</span>
                          <p className="text-sm text-muted-foreground">Teachers can join using the teacher join code</p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="teacherJoinType"
                          value="manual"
                          checked={teacherJoinType === "manual"}
                          onChange={(e) => setTeacherJoinType(e.target.value)}
                          className="text-primary"
                        />
                        <div>
                          <span className="text-foreground font-medium">Manual Approval</span>
                          <p className="text-sm text-muted-foreground">Teachers must be manually added by admin</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Club Settings */}
              <div>
                <h3 className="text-xl font-semibold mb-6 text-foreground">Club Settings</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-foreground">
                        Max Clubs per Student (Optional)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 3"
                        value={maxClubsPerStudent}
                        onChange={(e) => setMaxClubsPerStudent(e.target.value)}
                        min="1"
                        className="input"
                      />
                      <p className="text-sm text-muted-foreground mt-2">Leave empty for no limit</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-foreground">
                        Max Students per Club (Optional)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 20"
                        value={maxStudentsPerClub}
                        onChange={(e) => setMaxStudentsPerClub(e.target.value)}
                        min="1"
                        className="input"
                      />
                      <p className="text-sm text-muted-foreground mt-2">Leave empty for no limit</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={allowStudentCreatedClubs}
                        onChange={(e) => setAllowStudentCreatedClubs(e.target.checked)}
                        className="text-primary"
                      />
                      <div>
                        <span className="text-foreground font-medium">Allow Students to Create Clubs</span>
                        <p className="text-sm text-muted-foreground">Students can create their own clubs (requires teacher approval)</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={requireTeacherApproval}
                        onChange={(e) => setRequireTeacherApproval(e.target.checked)}
                        className="text-primary"
                      />
                      <div>
                        <span className="text-foreground font-medium">Require Teacher Approval for Club Joins</span>
                        <p className="text-sm text-muted-foreground">Students must request approval to join clubs</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Authorized Admin Emails */}
              <div>
                <h3 className="text-xl font-semibold mb-6 text-foreground">👥 Authorized Admin Emails</h3>
                <p className="text-muted-foreground mb-6">
                  Add email addresses that will automatically receive admin access when they sign up.
                  Perfect for counselors, assistant principals, and other administrators.
                </p>
                
                <div className="mb-6">
                  <div className="flex gap-3">
                    <input
                      type="email"
                      placeholder="Enter email address (e.g., counselor@school.edu)"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="flex-1 input"
                    />
                    <button
                      onClick={addAuthorizedAdmin}
                      className="btn-primary"
                    >
                      Add Admin
                    </button>
                  </div>
                </div>

                {authorizedAdmins.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground">Authorized Emails:</h4>
                    <div className="card overflow-hidden">
                      {authorizedAdmins.map((email, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-4 ${
                            index !== authorizedAdmins.length - 1 ? 'border-b border-border' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-success rounded-full"></div>
                            <span className="text-foreground font-medium">{email}</span>
                          </div>
                          <button
                            onClick={() => removeAuthorizedAdmin(email)}
                            className="text-destructive hover:text-destructive/80 text-sm px-3 py-1 rounded hover:bg-destructive/10 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card p-8 text-center">
                    <div className="text-muted-foreground mb-4">
                      <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground text-sm">No authorized admin emails added yet.</p>
                    <p className="text-muted-foreground text-xs mt-2">Add email addresses above to grant admin access</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-success flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Settings
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push("/admin/dashboard")}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
} 