"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, deleteDoc } from "firebase/firestore";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import Modal from "../../../components/Modal";
import { useModal } from "../../../utils/useModal";

export default function SchoolManagementPage() {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Form state
  const [schoolName, setSchoolName] = useState("");
  const [studentJoinType, setStudentJoinType] = useState("code"); // "code" or "manual"
  const [teacherJoinType, setTeacherJoinType] = useState("code"); // "code" or "manual"
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [authorizedAdmins, setAuthorizedAdmins] = useState([]);
  const [schoolCreator, setSchoolCreator] = useState(null);
  const [gradeLevels, setGradeLevels] = useState([]);

  // Refs for sections
  const overviewRef = useRef(null);
  const basicSettingsRef = useRef(null);
  const joinSettingsRef = useRef(null);
  const adminManagementRef = useRef(null);
  const advancedSettingsRef = useRef(null);
  const mainContentRef = useRef(null);

  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const { modalState, showAlert, closeModal } = useModal();

  // Navigation items
  const navigationItems = [
    {
      id: "overview",
      label: "Overview",
      icon: "school",
      description: "School information and join codes"
    },
    {
      id: "basic-settings",
      label: "Basic Settings",
      icon: "settings",
      description: "School name and basic information"
    },
    {
      id: "join-settings",
      label: "Join Settings",
      icon: "lock",
      description: "How users can join your school"
    },
    {
      id: "admin-management",
      label: "Admin Management",
      icon: "users",
      description: "Manage administrator access"
    },
    {
      id: "advanced-settings",
      label: "Advanced Settings",
      icon: "wrench",
      description: "Advanced configuration options"
    }
  ];

  // Function to scroll to section
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const refs = {
      overview: overviewRef,
      "basic-settings": basicSettingsRef,
      "join-settings": joinSettingsRef,
      "admin-management": adminManagementRef,
      "advanced-settings": advancedSettingsRef
    };
    
    const targetRef = refs[sectionId];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Function to check for unsaved changes
  const checkForUnsavedChanges = () => {
    const originalSchoolName = school?.name || "";
    const originalStudentJoinType = school?.studentJoinType || "code";
    const originalTeacherJoinType = school?.teacherJoinType || "code";
    const originalGradeLevels = school?.gradeLevels || [];
    
    const hasChanges = 
      schoolName !== originalSchoolName ||
      studentJoinType !== originalStudentJoinType ||
      teacherJoinType !== originalTeacherJoinType ||
      JSON.stringify(gradeLevels.sort()) !== JSON.stringify(originalGradeLevels.sort());
    
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  };

  // Function to handle navigation with unsaved changes
  const handleNavigation = (path) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedChangesModal(true);
    } else {
      router.push(path);
    }
  };

  // Function to confirm navigation (save or leave)
  const confirmNavigation = (shouldSave) => {
    if (shouldSave) {
      handleSave().then(() => {
        if (pendingNavigation) {
          router.push(pendingNavigation);
          setPendingNavigation(null);
        }
      });
    } else {
      if (pendingNavigation) {
        router.push(pendingNavigation);
        setPendingNavigation(null);
      }
    }
    setShowUnsavedChangesModal(false);
  };

  // Function to update active section based on scroll position
  const updateActiveSection = () => {
    const sections = [
      { id: "overview", ref: overviewRef },
      { id: "basic-settings", ref: basicSettingsRef },
      { id: "join-settings", ref: joinSettingsRef },
      { id: "admin-management", ref: adminManagementRef },
      { id: "advanced-settings", ref: advancedSettingsRef }
    ];

    if (!mainContentRef.current) return;

    const scrollPosition = mainContentRef.current.scrollTop + 100; // Offset for better detection
    let currentSection = "overview"; // Default to overview

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.ref.current) {
        const elementTop = section.ref.current.offsetTop;
        const elementBottom = elementTop + section.ref.current.offsetHeight;
        
        if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
          currentSection = section.id;
          break;
        }
      }
    }

    console.log('Scroll position:', scrollPosition, 'Active section:', currentSection);
    setActiveSection(currentSection);
  };

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
        
        // Get school creator info first
        let creatorData = null;
        if (schoolData.createdBy) {
          try {
            const creatorDoc = await getDoc(doc(firestore, "users", schoolData.createdBy));
            if (creatorDoc.exists()) {
              creatorData = creatorDoc.data();
              setSchoolCreator(creatorData);
            }
          } catch (error) {
            console.error("Error fetching school creator:", error);
          }
        }
        
        // Set form values
        setSchoolName(schoolData.name || "");
        setStudentJoinType(schoolData.studentJoinType || "code");
        setTeacherJoinType(schoolData.teacherJoinType || "code");
        setGradeLevels(schoolData.gradeLevels || []);
        
        // Filter out the school creator's email from authorized admins to prevent duplication
        const authorizedEmails = schoolData.authorizedAdminEmails || [];
        const filteredEmails = creatorData 
          ? authorizedEmails.filter(email => email !== creatorData.email)
          : authorizedEmails;
        setAuthorizedAdmins(filteredEmails);
        
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

  // Monitor for unsaved changes
  useEffect(() => {
    if (school) {
      checkForUnsavedChanges();
    }
  }, [schoolName, studentJoinType, teacherJoinType, gradeLevels, school]);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Add scroll listener for active section tracking
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      console.log('Scroll event triggered, scrollTop:', mainContentRef.current?.scrollTop);
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Wait for the main content to be available
    const setupScrollListener = () => {
      if (mainContentRef.current) {
        mainContentRef.current.addEventListener('scroll', handleScroll, { passive: true });
        return () => mainContentRef.current?.removeEventListener('scroll', handleScroll);
      }
    };

    // Set up the listener after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(setupScrollListener, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (mainContentRef.current) {
        mainContentRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [mainContentRef.current]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updateData = {
        name: schoolName.trim(),
        studentJoinType,
        teacherJoinType,
        gradeLevels,
      };

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
    if (!newAdminEmail.trim()) return;

    const email = newAdminEmail.trim().toLowerCase();
    
    // Check if email is already in the list
    if (authorizedAdmins.includes(email)) {
      setError("This email is already authorized.");
      return;
    }

    // Check if it's the school creator's email
    if (schoolCreator && schoolCreator.email === email) {
      setError("The school creator is already an admin.");
      return;
    }

    try {
      const updatedEmails = [...authorizedAdmins, email];
      await updateDoc(doc(firestore, "schools", userData.schoolId), {
        authorizedAdminEmails: updatedEmails
      });
      
      setAuthorizedAdmins(updatedEmails);
      setNewAdminEmail("");
      setSuccess("Admin access granted successfully!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error adding admin:", error);
      setError("Failed to add admin. Please try again.");
    }
  };

  const removeAuthorizedAdmin = async (emailToRemove) => {
    try {
      const updatedEmails = authorizedAdmins.filter(email => email !== emailToRemove);
      await updateDoc(doc(firestore, "schools", userData.schoolId), {
        authorizedAdminEmails: updatedEmails
      });
      
      setAuthorizedAdmins(updatedEmails);
      setSuccess("Admin access removed successfully!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error removing admin:", error);
      setError("Failed to remove admin. Please try again.");
    }
  };

  const generateUniqueJoinCode = async (codeType) => {
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const newCode = generateCode();
      
      // Check if code already exists
      const schoolsQuery = query(
        collection(firestore, "schools"),
        where(codeType === 'student' ? 'studentJoinCode' : 'teacherJoinCode', '==', newCode)
      );
      const schoolsSnapshot = await getDocs(schoolsQuery);
      
      if (schoolsSnapshot.empty) {
        return newCode;
      }
      
      attempts++;
    }

    // If we can't find a unique code, append timestamp
    return generateCode() + Date.now().toString().slice(-4);
  };

  const regenerateJoinCodes = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const newStudentCode = await generateUniqueJoinCode('student');
      const newTeacherCode = await generateUniqueJoinCode('teacher');

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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleDeleteSchool = async () => {
    if (!school) return;
    
    setSaving(true);
    setError("");
    setShowDeleteModal(false);
    
    try {
      // Get all students in this school
      const studentsQuery = query(
        collection(firestore, "users"),
        where("schoolId", "==", school.id),
        where("role", "==", "student")
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      
      // Get all teachers in this school
      const teachersQuery = query(
        collection(firestore, "users"),
        where("schoolId", "==", school.id),
        where("role", "==", "teacher")
      );
      const teachersSnapshot = await getDocs(teachersQuery);
      
      // Get all admins in this school
      const adminsQuery = query(
        collection(firestore, "users"),
        where("schoolId", "==", school.id),
        where("role", "==", "admin")
      );
      const adminsSnapshot = await getDocs(adminsQuery);
      
      // Update all users to remove school association
      const updatePromises = [];
      
      // Update students
      studentsSnapshot.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            schoolId: null,
            schoolName: null,
            updatedAt: serverTimestamp()
          })
        );
      });
      
      // Update teachers
      teachersSnapshot.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            schoolId: null,
            schoolName: null,
            updatedAt: serverTimestamp()
          })
        );
      });
      
      // Update admins
      adminsSnapshot.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            schoolId: null,
            schoolName: null,
            updatedAt: serverTimestamp()
          })
        );
      });
      
      // Wait for all user updates to complete
      await Promise.all(updatePromises);
      
      // Delete school-specific data (clubs, events, etc.)
      // Get all clubs in this school
      const clubsQuery = query(
        collection(firestore, "clubs"),
        where("schoolId", "==", school.id)
      );
      const clubsSnapshot = await getDocs(clubsQuery);
      
      // Delete all clubs
      const clubDeletePromises = clubsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(clubDeletePromises);
      
      // Finally, delete the school document
      await deleteDoc(doc(firestore, "schools", school.id));
      
      setSuccess("School deleted successfully. All users can now join a new school. Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error deleting school:", error);
      setError("Failed to delete school. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      school: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      settings: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      lock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      wrench: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    };
    return icons[iconName] || icons.settings;
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background text-foreground">
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
        <div className="min-h-screen bg-background text-foreground">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl">
              {error}
            </div>
            <button
              onClick={() => handleNavigation("/admin/dashboard")}
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
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Admin Dashboard" onNavigation={handleNavigation} />
        
        {/* Back Button */}
        <div className="border-b border-border">
          <div className="container mx-auto px-6 py-4">
            <button
              onClick={() => handleNavigation("/admin/dashboard")}
              className="btn-outline flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-border bg-muted/30">
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6">School Management</h1>
              
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                      activeSection === item.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getIcon(item.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs opacity-80">{item.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div ref={mainContentRef} className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8">
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

              {/* Overview Section */}
              <section ref={overviewRef} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h2 className="text-2xl font-bold">Overview</h2>
                </div>
                
                {school && (
                  <div className="space-y-6">
                    {/* School Info Card */}
                    <div className="card p-6">
                      <h3 className="text-xl font-semibold mb-4">{school.name}</h3>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                             <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                             </svg>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Student Join Code</p>
                             <div className="flex items-center gap-2">
                               <code className="bg-muted px-3 py-2 rounded-lg text-sm font-mono">
                                 {school.studentJoinCode}
                               </code>
                               <button 
                                 onClick={() => copyToClipboard(school.studentJoinCode)}
                                 className="btn-ghost text-sm p-2"
                                 title="Copy to clipboard"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                 </svg>
                               </button>
                             </div>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                             <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                             </svg>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Teacher Join Code</p>
                             <div className="flex items-center gap-2">
                               <code className="bg-muted px-3 py-2 rounded-lg text-sm font-mono">
                                 {school.teacherJoinCode}
                               </code>
                               <button 
                                 onClick={() => copyToClipboard(school.teacherJoinCode)}
                                 className="btn-ghost text-sm p-2"
                                 title="Copy to clipboard"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                 </svg>
                               </button>
                             </div>
                           </div>
                         </div>
                       </div>
                      
                      <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-foreground">Grade Levels</h4>
                        </div>
                        {school.gradeLevels && school.gradeLevels.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {school.gradeLevels.map((grade) => (
                              <span key={grade} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                                {grade === 1 ? '1st' : 
                                 grade === 2 ? '2nd' : 
                                 grade === 3 ? '3rd' : 
                                 `${grade}th`} Grade
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No grade levels configured</p>
                        )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-border">
                        <button
                          onClick={regenerateJoinCodes}
                          disabled={saving}
                          className="btn-outline flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Regenerate Join Codes
                        </button>
                      </div>
                    </div>


                  </div>
                )}
              </section>

              {/* Basic Settings Section */}
              <section ref={basicSettingsRef} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h2 className="text-2xl font-bold">Basic Settings</h2>
                </div>
                
                <div className="card p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-foreground">
                        School Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter school name"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="input w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-foreground">
                        Grade Levels
                      </label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select which grades attend your school
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                          <label key={grade} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={gradeLevels.includes(grade)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGradeLevels([...gradeLevels, grade].sort((a, b) => a - b));
                                } else {
                                  setGradeLevels(gradeLevels.filter(g => g !== grade));
                                }
                              }}
                              className="text-primary"
                            />
                            <span className="text-foreground font-medium">
                              {grade === 1 ? '1st' : 
                               grade === 2 ? '2nd' : 
                               grade === 3 ? '3rd' : 
                               `${grade}th`} Grade
                            </span>
                          </label>
                        ))}
                      </div>
                      {gradeLevels.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-3">
                          Selected: {gradeLevels.map(g => 
                            g === 1 ? '1st' : 
                            g === 2 ? '2nd' : 
                            g === 3 ? '3rd' : 
                            `${g}th`
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Join Settings Section */}
              <section ref={joinSettingsRef} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h2 className="text-2xl font-bold">Join Settings</h2>
                </div>
                
                <div className="card p-6">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-foreground">Student Join Method</h3>
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
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
                        <label className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
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
                      <h3 className="text-lg font-semibold mb-4 text-foreground">Teacher Join Method</h3>
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
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
                        <label className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
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
              </section>

                             {/* Admin Management Section */}
               <section ref={adminManagementRef} className="mb-12">
                 <div className="flex items-center gap-3 mb-6">
                   <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                   </svg>
                   <h2 className="text-2xl font-bold">Admin Management</h2>
                 </div>
                 
                 <div className="card p-6">
                   <p className="text-muted-foreground mb-6">
                     Users with admin access to this school. The school creator has full access and cannot be removed.
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

                   {/* Authorized Users List */}
                   <div className="space-y-3">
                     {/* School Creator */}
                     {schoolCreator && (
                       <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                             <span className="text-primary font-semibold">
                               {schoolCreator.displayName?.charAt(0) || schoolCreator.email.charAt(0).toUpperCase()}
                             </span>
                           </div>
                           <div>
                             <div className="flex items-center gap-2">
                               <span className="text-foreground font-medium">{schoolCreator.displayName || schoolCreator.email}</span>
                               <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                               </svg>
                             </div>
                             <p className="text-sm text-muted-foreground">{schoolCreator.email}</p>
                           </div>
                         </div>
                         <span className="text-primary text-sm font-semibold">Creator</span>
                       </div>
                     )}

                     {/* Additional Authorized Admins */}
                     {authorizedAdmins.map((email, index) => (
                       <div 
                         key={index} 
                         className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg"
                       >
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                             <span className="text-success font-semibold">
                               {email.charAt(0).toUpperCase()}
                             </span>
                           </div>
                           <div>
                             <p className="font-medium">{email}</p>
                             <p className="text-sm text-muted-foreground">Admin Access</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="badge-success">Active</span>
                           <button
                             onClick={() => removeAuthorizedAdmin(email)}
                             className="btn-ghost text-destructive hover:text-destructive/80 text-sm"
                           >
                             Remove
                           </button>
                         </div>
                       </div>
                     ))}

                     {/* Empty state when no additional admins */}
                     {authorizedAdmins.length === 0 && !schoolCreator && (
                       <div className="p-8 text-center">
                         <div className="text-muted-foreground mb-4">
                           <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                           </svg>
                         </div>
                         <p className="text-muted-foreground text-sm">No authorized users yet.</p>
                         <p className="text-muted-foreground text-xs mt-2">Add email addresses above to grant admin access</p>
                       </div>
                     )}
                   </div>
                 </div>
               </section>

               {/* Save Changes Section */}
               <section className="mb-12">
                 <div className="card p-6 border-t-4 border-t-primary">
                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="text-lg font-semibold text-foreground">Save All Changes</h3>
                       <p className="text-sm text-muted-foreground">
                         Review your changes and save them all at once
                       </p>
                     </div>
                     <div className="flex gap-4">
                       <button
                         onClick={handleSave}
                         disabled={saving}
                         className="btn-primary flex items-center gap-2"
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
                             Save All Changes
                           </>
                         )}
                       </button>
                     </div>
                   </div>
                 </div>
               </section>

               {/* Advanced Settings Section */}
               <section ref={advancedSettingsRef} className="mb-12">
                 <div className="flex items-center gap-3 mb-6">
                   <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                   <h2 className="text-2xl font-bold">Advanced Settings</h2>
                 </div>
                 
                 <div className="card p-6">
                   <p className="text-muted-foreground mb-6">
                     Advanced configuration options for your school. These settings affect the overall behavior of the platform.
                   </p>
                   
                   <div className="space-y-6">
                     <div className="p-4 border border-border rounded-lg">
                       <h3 className="font-semibold mb-2">Data Export</h3>
                       <p className="text-sm text-muted-foreground mb-3">
                         Export school data including student information, club data, and activity logs.
                       </p>
                       <button className="btn-outline text-sm">
                         Export School Data
                       </button>
                     </div>
                     
                     <div className="p-4 border border-border rounded-lg">
                       <h3 className="font-semibold mb-2">Privacy Settings</h3>
                       <p className="text-sm text-muted-foreground mb-3">
                         Configure privacy settings and data retention policies.
                       </p>
                       <button className="btn-outline text-sm">
                         Configure Privacy
                       </button>
                     </div>
                     
                     <div className="p-4 border border-destructive/20 rounded-lg">
                       <h3 className="font-semibold mb-2 text-destructive">Danger Zone</h3>
                       <p className="text-sm text-muted-foreground mb-3">
                         Irreversible actions that will permanently affect your school.
                       </p>
                       <button 
                         onClick={() => setShowDeleteModal(true)}
                         disabled={saving}
                         className="btn-destructive text-sm flex items-center gap-2"
                       >
                         {saving ? (
                           <>
                             <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                             Deleting...
                           </>
                         ) : (
                           <>
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                             Delete School
                           </>
                         )}
                       </button>
                     </div>
                   </div>
                 </div>
               </section>
             </div>
           </div>
         </div>
       </div>

       {/* Delete School Confirmation Modal */}
       <Modal
         isOpen={showDeleteModal}
         onClose={() => setShowDeleteModal(false)}
         onConfirm={handleDeleteSchool}
         title="Delete School"
         type="confirm"
       >
         <div className="space-y-4">
           <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
             <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
             </svg>
             <div>
               <p className="font-semibold text-destructive">This action cannot be undone</p>
               <p className="text-sm text-muted-foreground">This will permanently delete your school and all associated data.</p>
             </div>
           </div>
           
           <div className="space-y-2">
             <p className="text-sm font-medium">The following will be permanently deleted:</p>
             <ul className="text-sm text-muted-foreground space-y-1 ml-4">
               <li>• All clubs and their activities</li>
               <li>• All events and announcements</li>
               <li>• School settings and configurations</li>
               <li>• Join codes and access permissions</li>
               <li>• School association from all user accounts</li>
             </ul>
             
             <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded-lg">
               <div className="flex items-center gap-2">
                 <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <p className="text-sm font-medium text-success">User accounts will be preserved</p>
               </div>
               <p className="text-xs text-muted-foreground mt-1">
                 Students, teachers, and admins can join a new school after deletion
               </p>
             </div>
           </div>
           
           <div className="p-3 bg-muted/30 rounded-lg">
             <p className="text-sm">
               <span className="font-medium">School:</span> {school?.name || "Unknown School"}
             </p>
           </div>
         </div>
       </Modal>

       {/* Unsaved Changes Modal */}
       <Modal
         isOpen={showUnsavedChangesModal}
         onClose={() => setShowUnsavedChangesModal(false)}
         title="Unsaved Changes"
         message="You have unsaved changes. Do you want to save them before leaving?"
         type="warning"
       >
         <div className="space-y-4">
           <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
             <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
             </svg>
             <div>
               <p className="font-semibold text-warning">Unsaved Changes Detected</p>
               <p className="text-sm text-muted-foreground">Your changes will be lost if you leave without saving.</p>
             </div>
           </div>
           
           <div className="flex gap-3">
             <button
               onClick={() => confirmNavigation(false)}
               className="btn-outline flex-1"
             >
               Leave Without Saving
             </button>
             <button
               onClick={() => confirmNavigation(true)}
               className="btn-primary flex-1"
             >
               Save & Continue
             </button>
           </div>
         </div>
       </Modal>
     </ProtectedRoute>
   );
 } 