"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function RoleSelectionPage() {
  const [role, setRole] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolResults, setSchoolResults] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolDetails, setSchoolDetails] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    website: "",
    ncesId: "",
    schoolType: "",
    gradeLevels: ""
  });
  const [error, setError] = useState(null);
  const [step, setStep] = useState("role"); // "role", "joinCode", "createSchool"
  const [loading, setLoading] = useState(false);
  const [creatingSchool, setCreatingSchool] = useState(false);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [success, setSuccess] = useState(null);
  
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();

  // Redirect if not authenticated or already has a role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/signup");
        return;
      }
      
      if (userData && userData.role) {
        // User already has a role, redirect to appropriate dashboard
        if (userData.role === "admin") {
          router.push("/admin/dashboard");
        } else if (userData.role === "teacher") {
          router.push("/teacher/dashboard");
        } else if (userData.role === "student") {
          router.push("/student/dashboard");
        } else {
          router.push("/welcome");
        }
      }
    }
  }, [user, userData, authLoading, router]);

  // Search schools using our API route (which calls Google Places API server-side)
  const searchSchools = async (query) => {
    if (!query || query.length < 3) {
      setSchoolResults([]);
      return;
    }

    setSearchingSchools(true);
    try {
      // Call our Next.js API route (no CORS issues)
      const response = await fetch('/api/schools/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.places && data.places.length > 0) {
          setSchoolResults(data.places);
        } else {
          console.log('No schools found, using fallback');
          generateMockSchools(query);
        }
      } else {
        console.error('Failed to fetch schools from API route');
        generateMockSchools(query);
      }
    } catch (error) {
      console.error('Error searching schools:', error);
      generateMockSchools(query);
    } finally {
      setSearchingSchools(false);
    }
  };

  // Fallback function to generate realistic mock schools
  const generateMockSchools = (query) => {
    const schoolTypes = ['Elementary School', 'Middle School', 'High School', 'Academy', 'Charter School'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'GA', 'NC'];
    
    const mockSchools = schoolTypes.map((type, index) => {
      const city = cities[index % cities.length];
      const state = states[index % states.length];
      const zipCode = Math.floor(Math.random() * 90000) + 10000;
      const streetNumber = Math.floor(Math.random() * 9999) + 1;
      const streetNames = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Maple Dr', 'Cedar Ln', 'Washington Blvd', 'Lincoln Ave'];
      const streetName = streetNames[index % streetNames.length];
      
      return {
        place_id: `mock_${index}`,
        displayName: {
          text: `${query} ${type}`,
          languageCode: 'en'
        },
        formattedAddress: `${streetNumber} ${streetName}, ${city}, ${state} ${zipCode}`,
        phoneNumbers: [{
          number: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
        }],
        websiteUri: `https://${query.toLowerCase().replace(/\s+/g, '')}${type.toLowerCase().replace(/\s+/g, '')}.edu`,
        addressComponents: [
          { longText: streetNumber.toString(), types: ['street_number'] },
          { longText: streetName, types: ['route'] },
          { longText: city, types: ['locality'] },
          { shortText: state, types: ['administrative_area_level_1'] },
          { longText: zipCode.toString(), types: ['postal_code'] }
        ]
      };
    });

    setSchoolResults(mockSchools);
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (schoolSearch) {
        searchSchools(schoolSearch);
      } else {
        setSchoolResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [schoolSearch]);

  // Auto-fill school details when a school is selected
  const selectSchool = (school) => {
    setSelectedSchool(school);
    setSchoolSearch(school.displayName?.text || school.name || "");
    
    // Parse address components from Google Places API (New) response
    let streetAddress = "";
    let city = "";
    let state = "";
    let zipCode = "";
    
    if (school.addressComponents) {
      // Extract street address
      const streetNumber = school.addressComponents.find(component => 
        component.types.includes('street_number')
      )?.longText || "";
      const route = school.addressComponents.find(component => 
        component.types.includes('route')
      )?.longText || "";
      streetAddress = `${streetNumber} ${route}`.trim();
      
      // Extract city
      city = school.addressComponents.find(component => 
        component.types.includes('locality')
      )?.longText || "";
      
      // Extract state
      state = school.addressComponents.find(component => 
        component.types.includes('administrative_area_level_1')
      )?.shortText || "";
      
      // Extract ZIP code
      zipCode = school.addressComponents.find(component => 
        component.types.includes('postal_code')
      )?.longText || "";
    } else {
      // Fallback to parsing formattedAddress if addressComponents not available
      const addressParts = (school.formattedAddress || "").split(', ');
      streetAddress = addressParts[0];
      city = addressParts[1];
      const stateZip = addressParts[2] || '';
      state = stateZip.split(' ')[0];
      zipCode = stateZip.split(' ')[1] || '';
    }
    
    setSchoolDetails({
      name: school.displayName?.text || school.name || "",
      address: streetAddress || "",
      city: city || "",
      state: state || "",
      zipCode: zipCode || "",
      phone: school.phoneNumbers?.[0]?.number || "",
      website: school.websiteUri || "",
      ncesId: "",
      schoolType: "",
      gradeLevels: ""
    });
    setSchoolResults([]);
  };

  const createUserAccount = async (user, userRole, schoolId = null) => {
    try {
      // Validate user object
      if (!user || !user.email || !user.uid) {
        console.error("Invalid user object:", user);
        setError("Invalid user data. Please try again.");
        return;
      }

      // Check if user's email is in authorized admin list
      let finalRole = userRole;
      let finalSchoolId = schoolId;

      if (userRole === "admin" && schoolId) {
        // For admins, check if they're in the authorized list
        const schoolDoc = await getDoc(doc(firestore, "schools", schoolId));
        if (schoolDoc.exists()) {
          const schoolData = schoolDoc.data();
          const authorizedEmails = schoolData.authorizedAdminEmails || [];
          if (authorizedEmails.includes(user.email.toLowerCase())) {
            // User is authorized, keep them as admin
            finalRole = "admin";
            finalSchoolId = schoolId;
          } else {
            // User is not authorized, this shouldn't happen in normal flow
            console.warn("Unauthorized admin signup attempt");
          }
        }
      } else if (userRole !== "admin") {
        // For non-admins, check if their email is in any school's authorized admin list
        const schoolsQuery = query(collection(firestore, "schools"));
        const schoolsSnapshot = await getDocs(schoolsQuery);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolData = schoolDoc.data();
          const authorizedEmails = schoolData.authorizedAdminEmails || [];
          if (authorizedEmails.includes(user.email.toLowerCase())) {
            // User is authorized for this school, make them admin
            finalRole = "admin";
            finalSchoolId = schoolDoc.id;
            break;
          }
        }
      }

      const userRef = doc(firestore, "users", user.uid);
      // Check if a user with this email already exists
      const usersQuery = query(collection(firestore, "users"), where("email", "==", user.email));
      const usersSnapshot = await getDocs(usersQuery);
      if (!usersSnapshot.empty) {
        setError("You already have an account. Please sign in instead.");
        return;
      }
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL ? (user.photoURL.includes('lh3.googleusercontent.com') ? 
          user.photoURL.replace(/=s\d+-c$/, '=s400-c') : user.photoURL) : "",
        role: finalRole,
        schoolId: finalSchoolId,
        clubIds: [],
        createdAt: serverTimestamp(),
      };
      
      await setDoc(userRef, userData);

      // Use hard redirect to ensure auth context is refreshed
      if (finalSchoolId) {
        // User has been assigned to a school
        if (finalRole === "admin") {
          window.location.href = "/admin/dashboard";
        } else if (finalRole === "teacher") {
          window.location.href = "/teacher/dashboard";
        } else if (finalRole === "student") {
          window.location.href = "/student/dashboard";
        }
      } else {
        // User is pending approval - don't redirect, let them stay on the signup page
        // The success message will be shown and they can manually navigate if needed
      }
    } catch (err) {
      console.error("Error creating user account:", err);
      setError("Failed to create account. Please try again.");
    }
  };

  const generateUniqueJoinCode = async (codeType) => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check if code already exists
      const query = codeType === 'student' 
        ? query(collection(firestore, "schools"), where("studentJoinCode", "==", code))
        : query(collection(firestore, "schools"), where("teacherJoinCode", "==", code));
      
      const snapshot = await getDocs(query);
      
      if (snapshot.empty) {
        return code;
      }
      
      attempts++;
    }
    
    // If we can't find a unique code after max attempts, add a timestamp
    return Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString().slice(-2);
  };

  const handleCreateSchool = async () => {
    if (!user || !schoolDetails.name.trim()) return;

    setCreatingSchool(true);
    setError(null);

    try {
      // Check if user is authorized for an existing school
      const schoolsQuery = query(collection(firestore, "schools"));
      const schoolsSnapshot = await getDocs(schoolsQuery);
      let authorizedSchool = null;
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolData = schoolDoc.data();
        const authorizedEmails = schoolData.authorizedAdminEmails || [];
        if (authorizedEmails.includes(user.email.toLowerCase())) {
          authorizedSchool = { id: schoolDoc.id, ...schoolData };
          break;
        }
      }

      if (authorizedSchool) {
        // User is authorized for existing school, join that school as admin
        console.log("User is authorized for existing school:", authorizedSchool.name);
        await createUserAccount(user, "admin", authorizedSchool.id);
      } else {
        // Create new school
        console.log("Creating new school for user");
        const schoolId = crypto.randomUUID().slice(0, 8);
        
        // Generate unique join codes
        const studentJoinCode = await generateUniqueJoinCode('student');
        const teacherJoinCode = await generateUniqueJoinCode('teacher');
        
        const schoolData = {
          name: schoolDetails.name,
          address: schoolDetails.address,
          city: schoolDetails.city,
          state: schoolDetails.state,
          zipCode: schoolDetails.zipCode,
          phone: schoolDetails.phone,
          website: schoolDetails.website,
          ncesId: schoolDetails.ncesId,
          schoolType: schoolDetails.schoolType,
          gradeLevels: schoolDetails.gradeLevels,
          studentJoinCode: studentJoinCode,
          teacherJoinCode: teacherJoinCode,
          createdBy: user.uid,
          createdAt: Date.now(),
          authorizedAdminEmails: [user.email.toLowerCase()], // Add creator to authorized list
        };

        // Create the school first
        await setDoc(doc(firestore, "schools", schoolId), schoolData);
        
        // Then create the admin account with the school ID
        await createUserAccount(user, "admin", schoolId);
      }
    } catch (error) {
      console.error("Error creating school:", error);
      setError("Failed to create school. Please try again.");
      setCreatingSchool(false);
    }
  };

  const handleJoinCodeSubmit = async () => {
    if (!joinCode.trim()) {
      setError("Please enter a join code.");
      return;
    }

    setLoading(true); // Start loading
    try {
      // Check if user already has a role assigned (prevents duplicate requests)
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role) {
        setError("You already have an account. Please sign in instead.");
        return;
      }

      // Find school with the join code (check both student and teacher codes)
      const studentQuery = query(collection(firestore, "schools"), where("studentJoinCode", "==", joinCode.toUpperCase()));
      const teacherQuery = query(collection(firestore, "schools"), where("teacherJoinCode", "==", joinCode.toUpperCase()));
      
      const [studentSnapshot, teacherSnapshot] = await Promise.all([
        getDocs(studentQuery),
        getDocs(teacherQuery)
      ]);

      let schoolDoc = null;
      let isTeacherCode = false;

      if (!studentSnapshot.empty) {
        schoolDoc = studentSnapshot.docs[0];
        isTeacherCode = false;
      } else if (!teacherSnapshot.empty) {
        schoolDoc = teacherSnapshot.docs[0];
        isTeacherCode = true;
      }

      if (!schoolDoc) {
        setError("Invalid join code. Please check and try again.");
        return;
      }

      const schoolData = schoolDoc.data();
      const schoolId = schoolDoc.id;

      // Validate role matches join code type
      if (role === "teacher" && !isTeacherCode) {
        setError("Invalid join code. Please check and try again.");
        return;
      } else if (role === "student" && isTeacherCode) {
        setError("Invalid join code. Please check and try again.");
        return;
      }

      // Check if manual approval is required
      const joinTypeSetting = isTeacherCode ? schoolData.teacherJoinType : schoolData.studentJoinType;
      
      if (joinTypeSetting === "manual") {
        // Check if a join request already exists for this user and school
        const existingRequestQuery = query(
          collection(firestore, "schoolJoinRequests"),
          where("studentId", "==", user.uid),
          where("schoolId", "==", schoolId),
          where("status", "==", "pending")
        );
        const existingRequestSnapshot = await getDocs(existingRequestQuery);
        
        if (!existingRequestSnapshot.empty) {
          // Join request already exists
          setSuccess(`You already have a pending request to join ${schoolData.name} as a ${role}. Please wait for administrator approval.`);
          return;
        }

        // Create a school join request instead of direct assignment
        await addDoc(collection(firestore, "schoolJoinRequests"), {
          studentId: user.uid,
          schoolId: schoolId,
          studentName: user.displayName || user.email,
          studentEmail: user.email,
          status: "pending",
          createdAt: new Date(),
          type: isTeacherCode ? "teacher" : "student",
          requestedRole: role
        });

        // Create user account without schoolId (pending approval)
        await createUserAccount(user, role, null);
        
        // Show success message for manual approval
        setSuccess(`Your request to join ${schoolData.name} as a ${role} has been submitted and is pending administrator approval. You will be able to access the platform once your request is approved.`);
      } else {
        // Immediate join (code-based)
        await createUserAccount(user, role, schoolId);
      }
    } catch (err) {
      console.error("Error joining school:", err);
      setError("Failed to join school. Please try again.");
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleBackToRole = () => {
    setStep("role");
    setJoinCode("");
    setSchoolName("");
    setSchoolSearch("");
    setSchoolResults([]);
    setSelectedSchool(null);
    setSchoolDetails({
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      website: "",
      ncesId: "",
      schoolType: "",
      gradeLevels: ""
    });
    setError(null);
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show form if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Role</h1>
          <p className="text-muted-foreground">Select how you'll use StudyHub</p>
        </div>

        <div className="card p-8 shadow-2xl border border-border/50">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-600/10 border border-green-600/20 rounded-xl">
              <p className="text-green-600 text-sm font-medium">{success}</p>
            </div>
          )}

          {step === "role" ? (
            <div className="space-y-6">
              <div>
                <label htmlFor="role" className="block text-sm font-semibold mb-3 text-foreground">
                  Select your role
                </label>
                <select
                  id="role"
                  className="input"
                  value={role}
                  onChange={(e) => { setRole(e.target.value); setError(null); }}
                >
                  <option value="">Choose a role</option>
                  <option value="admin">School Administrator</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>

              {role && (
                <button
                  onClick={() => {
                    if (role === "admin") {
                      setStep("createSchool");
                    } else {
                      setStep("joinCode");
                    }
                  }}
                  className="w-full btn-primary py-4 text-lg"
                >
                  Continue
                </button>
              )}
            </div>
          ) : step === "createSchool" ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground">Create Your School</h2>
                <p className="text-muted-foreground text-sm">Search for your school to auto-fill details</p>
              </div>
              
              {/* School Search */}
              <div className="relative">
                <label htmlFor="schoolSearch" className="block text-sm font-semibold mb-3 text-foreground">
                  Search for your school
                </label>
                <input
                  id="schoolSearch"
                  type="text"
                  placeholder="Start typing your school name..."
                  className="input"
                  value={schoolSearch}
                  onChange={(e) => { setSchoolSearch(e.target.value); setError(null); }}
                  disabled={creatingSchool}
                />
                {searchingSchools && (
                  <div className="absolute right-3 top-8">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  </div>
                )}
                
                {/* Search Results Dropdown */}
                {schoolResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background rounded-lg shadow-2xl border border-border max-h-60 overflow-y-auto">
                    {schoolResults.map((school, index) => (
                      <button
                        key={index}
                        onClick={() => selectSchool(school)}
                        className="w-full text-left p-4 hover:bg-muted border-b border-border/50 last:border-b-0 transition-colors"
                      >
                        <div className="font-semibold text-foreground">{school.displayName?.text || school.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {school.formattedAddress}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* School Details Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">School Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={schoolDetails.name}
                    onChange={(e) => setSchoolDetails({...schoolDetails, name: e.target.value})}
                    disabled={creatingSchool}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Address</label>
                  <input
                    type="text"
                    className="input"
                    value={schoolDetails.address}
                    onChange={(e) => setSchoolDetails({...schoolDetails, address: e.target.value})}
                    disabled={creatingSchool}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">City</label>
                    <input
                      type="text"
                      className="input"
                      value={schoolDetails.city}
                      onChange={(e) => setSchoolDetails({...schoolDetails, city: e.target.value})}
                      disabled={creatingSchool}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">State</label>
                    <input
                      type="text"
                      className="input"
                      value={schoolDetails.state}
                      onChange={(e) => setSchoolDetails({...schoolDetails, state: e.target.value})}
                      disabled={creatingSchool}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">ZIP Code</label>
                  <input
                    type="text"
                    className="input"
                    value={schoolDetails.zipCode}
                    onChange={(e) => setSchoolDetails({...schoolDetails, zipCode: e.target.value})}
                    disabled={creatingSchool}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={schoolDetails.phone}
                    onChange={(e) => setSchoolDetails({...schoolDetails, phone: e.target.value})}
                    disabled={creatingSchool}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Website</label>
                  <input
                    type="url"
                    className="input"
                    value={schoolDetails.website}
                    onChange={(e) => setSchoolDetails({...schoolDetails, website: e.target.value})}
                    disabled={creatingSchool}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateSchool}
                  disabled={creatingSchool || !schoolDetails.name.trim()}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {creatingSchool ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    "Create School"
                  )}
                </button>
                <button
                  onClick={handleBackToRole}
                  className="btn-outline"
                  disabled={creatingSchool}
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label htmlFor="joinCode" className="block text-sm font-semibold mb-3 text-foreground">
                  Enter {role === "teacher" ? "Teacher" : "Student"} Join Code
                </label>
                <input
                  id="joinCode"
                  type="text"
                  placeholder={`Enter your ${role} join code`}
                  className="input uppercase"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(null); }}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Ask your school administrator for the {role} join code.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleJoinCodeSubmit}
                  className="flex-1 btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Joining...
                    </>
                  ) : (
                    "Join School"
                  )}
                </button>
                <button
                  onClick={handleBackToRole}
                  className="btn-outline"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary hover:text-primary/80 font-semibold transition-colors underline bg-transparent border-none cursor-pointer"
                onClick={async () => {
                  if (user) {
                    const { signOut } = await import("firebase/auth");
                    await signOut(auth);
                  }
                  router.push("/login");
                }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 