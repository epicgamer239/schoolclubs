"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../components/AuthContext";
import DashboardTopBar from "../../../../components/DashboardTopBar";
import Modal from "../../../../components/Modal";
import { useModal } from "../../../../utils/useModal";

export default function AdminCreateClubPage() {
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const router = useRouter();
  const { userData } = useAuth();
  const { modalState, showAlert, closeModal } = useModal();

  // Fetch teachers and tags from the school
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.schoolId) return;

      try {
        // Fetch teachers
        const teachersQuery = query(
          collection(firestore, "users"),
          where("schoolId", "==", userData.schoolId),
          where("role", "==", "teacher")
        );
        const teachersSnapshot = await getDocs(teachersQuery);
        const teacherList = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort teachers alphabetically by name
        const sortedTeachers = teacherList.sort((a, b) => {
          const nameA = (a.displayName || a.email || "").toLowerCase();
          const nameB = (b.displayName || b.email || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setTeachers(sortedTeachers);
        setLoadingTeachers(false);

        // Fetch tags
        const tagsQuery = query(
          collection(firestore, "tags"),
          where("schoolId", "==", userData.schoolId)
        );
        const tagsSnapshot = await getDocs(tagsQuery);
        const tagsList = tagsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAvailableTags(tagsList);
        setLoadingTags(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
        setLoadingTeachers(false);
        setLoadingTags(false);
      }
    };

    if (userData) {
      fetchData();
    }
  }, [userData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!clubName.trim() || !description.trim()) {
      setError("Both club name and description are required.");
      setLoading(false);
      return;
    }

    if (!userData?.schoolId) {
      setError("You must be associated with a school to create a club.");
      setLoading(false);
      return;
    }

    try {
      // Check for duplicate club names in the same school
      const existingClubsQuery = query(
        collection(firestore, "clubs"),
        where("schoolId", "==", userData.schoolId),
        where("name", "==", clubName.trim())
      );
      const existingClubsSnapshot = await getDocs(existingClubsQuery);
      
      if (!existingClubsSnapshot.empty) {
        setError("A club with this name already exists in your school. Please choose a different name.");
        setLoading(false);
        return;
      }

      const clubData = {
        name: clubName.trim(),
        description: description.trim(),
        schoolId: userData.schoolId,
        studentIds: [],
        tagIds: selectedTags,
        createdAt: serverTimestamp(),
      };

      // Only add teacherId if a teacher is selected
      if (selectedTeacherId) {
        clubData.teacherId = selectedTeacherId;
      }

      const docRef = await addDoc(collection(firestore, "clubs"), clubData);

      showAlert("Success", "Club created successfully!");
      router.push("/admin/clubs");
    } catch (err) {
      console.error("Error creating club:", err);
      setError("Something went wrong while creating the club.");
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Admin Dashboard" />
        
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/admin/clubs")}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Manage Clubs
          </button>

          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Create New Club</h1>
              <p className="text-muted-foreground mt-2">Add a new club to your school's offerings</p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="card p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-foreground">
                    Club Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter club name"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-foreground">
                    Description *
                  </label>
                  <textarea
                    placeholder="Describe what this club is about..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input h-32 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-foreground">
                    Teacher Sponsor (Optional)
                  </label>
                  {loadingTeachers ? (
                    <div className="input text-muted-foreground">
                      Loading teachers...
                    </div>
                  ) : (
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="input"
                    >
                      <option value="">No teacher sponsor (Executive creation)</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.displayName || teacher.email}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Select a teacher to sponsor this club, or leave empty for executive creation without a sponsor.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-foreground">
                    Tags (Optional)
                  </label>
                  {loadingTags ? (
                    <div className="input text-muted-foreground">
                      Loading tags...
                    </div>
                  ) : availableTags.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              if (selectedTags.includes(tag.id)) {
                                setSelectedTags(selectedTags.filter(id => id !== tag.id));
                              } else {
                                setSelectedTags([...selectedTags, tag.id]);
                              }
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                              selectedTags.includes(tag.id)
                                ? 'border-transparent text-white'
                                : 'border-border text-foreground hover:border-primary'
                            }`}
                            style={{
                              backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent'
                            }}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select tags to help categorize this club. You can manage tags in the admin dashboard.
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No tags available. Create tags in the admin dashboard first.
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Club
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => router.push("/admin/clubs")}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </ProtectedRoute>
  );
} 