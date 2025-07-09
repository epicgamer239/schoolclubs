// ✅ Combined and updated AdminDashboard and SignupPage with clean logic and safe defaults

// --- AdminDashboard (pages/admin/dashboard/page.js) ---
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  doc, getDoc, collection,
  getDocs, query, where, orderBy, limit
} from "firebase/firestore";
import DashboardTopBar from "../../../components/DashboardTopBar";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";

export default function AdminDashboard() {
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({ 
    students: 0, 
    teachers: 0, 
    clubs: 0, 
    totalMemberships: 0,
    activeClubs: 0,
    pendingRequests: 0,
    pendingSchoolRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherAdmins, setOtherAdmins] = useState([]);
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userData?.uid || !userData?.schoolId) return;

      try {
        // Fetch school data
        const schoolDoc = await getDoc(doc(firestore, "schools", userData.schoolId));
        if (schoolDoc.exists()) {
          const schoolData = { id: userData.schoolId, ...schoolDoc.data() };
          setSchool(schoolData);
        } else {
          console.error("School not found");
          setLoading(false);
          return;
        }

        const usersRef = collection(firestore, "users");
        const clubsRef = collection(firestore, "clubs");
        const requestsRef = collection(firestore, "joinRequests");
        const schoolRequestsRef = collection(firestore, "schoolJoinRequests");

        // Fetch all data in parallel
        const [studentsSnap, teachersSnap, clubsSnap, requestsSnap, adminsSnap, schoolRequestsSnap] = await Promise.all([
          getDocs(query(usersRef, where("schoolId", "==", userData.schoolId), where("role", "==", "student"))),
          getDocs(query(usersRef, where("schoolId", "==", userData.schoolId), where("role", "==", "teacher"))),
          getDocs(query(clubsRef, where("schoolId", "==", userData.schoolId))),
          getDocs(query(requestsRef, where("status", "==", "pending"))),
          getDocs(query(usersRef, where("schoolId", "==", userData.schoolId), where("role", "==", "admin"))),
          getDocs(query(schoolRequestsRef, where("schoolId", "==", userData.schoolId), where("status", "==", "pending")))
        ]);

        const clubs = clubsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalMemberships = clubs.reduce((sum, club) => sum + (club.studentIds?.length || 0), 0);
        const activeClubs = clubs.filter(club => (club.studentIds?.length || 0) > 0).length;

        // Get other admins (excluding current user)
        const allAdmins = adminsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const otherAdminsList = allAdmins.filter(admin => admin.uid !== userData.uid);
        setOtherAdmins(otherAdminsList);

        setStats({
          students: studentsSnap.size,
          teachers: teachersSnap.size,
          clubs: clubsSnap.size,
          totalMemberships,
          activeClubs,
          pendingRequests: requestsSnap.size,
          pendingSchoolRequests: schoolRequestsSnap.size
        });

        // Removed top clubs functionality

        // Get recent activity (recently created clubs)
        const recentClubs = clubs
          .sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return b.createdAt.toDate() - a.createdAt.toDate();
            }
            return 0;
          })
          .slice(0, 5);
        setRecentActivity(recentClubs);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    if (!authLoading && userData) {
      fetchDashboardData();
    }
  }, [userData, authLoading]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const getMembershipPercentage = () => {
    if (stats.students === 0) return 0;
    return Math.round((stats.totalMemberships / stats.students) * 100);
  };

  const getActiveClubsPercentage = () => {
    if (stats.clubs === 0) return 0;
    return Math.round((stats.activeClubs / stats.clubs) * 100);
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

  if (!school) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2">School Not Found</h2>
              <p className="text-muted-foreground">There was an issue loading your school data.</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Admin Dashboard" />
        
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span>🏫 {school.name}</span>
              <span>•</span>
              <div className="flex items-center space-x-4">
                <span>Student Code: <code className="bg-muted px-3 py-1 rounded-lg text-sm font-mono border border-border">{school.studentJoinCode}</code></span>
                <span>Teacher Code: <code className="bg-muted px-3 py-1 rounded-lg text-sm font-mono border border-border">{school.teacherJoinCode}</code></span>
              </div>
            </div>
            
            {/* School Details */}
            {school.address && (
              <div className="mt-6 card p-6">
                <h3 className="text-lg font-semibold mb-4">🏫 School Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">Address:</span>
                    <p className="text-foreground font-medium">{school.address}</p>
                    <p className="text-foreground font-medium">{school.city}, {school.state} {school.zipCode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Contact:</span>
                    {school.phone && <p className="text-foreground font-medium">📞 {school.phone}</p>}
                    {school.website && (
                      <p className="text-foreground font-medium">
                        🌐 <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                          {school.website}
                        </a>
                      </p>
                    )}
                  </div>
                  {school.schoolType && (
                    <div>
                      <span className="text-muted-foreground font-medium">Type:</span>
                      <p className="text-foreground font-medium">{school.schoolType}</p>
                    </div>
                  )}
                  {school.gradeLevels && (
                    <div>
                      <span className="text-muted-foreground font-medium">Grade Levels:</span>
                      <p className="text-foreground font-medium">{school.gradeLevels}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary text-sm font-semibold">Total Students</p>
                  <p className="text-3xl font-bold text-foreground">{stats.students}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-primary/80">Active in clubs: {stats.totalMemberships}</span>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-success text-sm font-semibold">Total Teachers</p>
                  <p className="text-3xl font-bold text-foreground">{stats.teachers}</p>
                </div>
                <div className="text-4xl">👨‍🏫</div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-success/80">Managing clubs</span>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary text-sm font-semibold">Total Clubs</p>
                  <p className="text-3xl font-bold text-foreground">{stats.clubs}</p>
                </div>
                <div className="text-4xl">📚</div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-secondary/80">{stats.activeClubs} active ({getActiveClubsPercentage()}%)</span>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-warning text-sm font-semibold">Pending Requests</p>
                  <p className="text-3xl font-bold text-foreground">{stats.pendingRequests}</p>
                </div>
                <div className="text-4xl">📝</div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-warning/80">Awaiting approval</span>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-500 text-sm font-semibold">School Join Requests</p>
                  <p className="text-3xl font-bold text-foreground">{stats.pendingSchoolRequests}</p>
                </div>
                <div className="text-4xl">🏫</div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-blue-500/80">Students & teachers waiting to join</span>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Engagement Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Student Participation</span>
                    <span className="text-foreground font-semibold">{getMembershipPercentage()}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${getMembershipPercentage()}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Active Clubs</span>
                    <span className="text-foreground font-semibold">{getActiveClubsPercentage()}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${getActiveClubsPercentage()}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Avg Members per Club</span>
                    <span className="text-foreground font-semibold">{stats.clubs > 0 ? Math.round(stats.totalMemberships / stats.clubs) : 0}</span>
                  </div>
                </div>
              </div>
            </div>



            {/* Recent Activity */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">🕒 Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((club) => (
                    <div key={club.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{club.name}</p>
                        <p className="text-sm text-muted-foreground">Created {formatDate(club.createdAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/admin/students")}
                className="flex items-center space-x-3 p-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-all duration-200 group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">👥</div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Student Look Up</p>
                  <p className="text-sm text-primary/80">Search & manage students</p>
                </div>
              </button>
              
              <button
                onClick={() => router.push("/admin/clubs")}
                className="flex items-center space-x-3 p-4 bg-success/10 hover:bg-success/20 border border-success/20 rounded-lg transition-all duration-200 group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">📚</div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Manage Clubs</p>
                  <p className="text-sm text-success/80">View & edit all clubs</p>
                </div>
              </button>
              
              <button
                onClick={() => router.push("/admin/school")}
                className="flex items-center space-x-3 p-4 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 rounded-lg transition-all duration-200 group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">🏫</div>
                <div className="text-left">
                  <p className="font-medium text-foreground">School Settings</p>
                  <p className="text-sm text-secondary/80">Configure school options</p>
                </div>
              </button>
              
              <button
                onClick={() => router.push("/admin/school-join-requests")}
                className="flex items-center space-x-3 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all duration-200 group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">📋</div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Join Requests</p>
                  <p className="text-sm text-blue-500/80">Review school join requests</p>
                </div>
              </button>
              
              <button
                onClick={() => router.push("/admin/clubs/create")}
                className="flex items-center space-x-3 p-4 bg-warning/10 hover:bg-warning/20 border border-warning/20 rounded-lg transition-all duration-200 group"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">➕</div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Create Club</p>
                  <p className="text-sm text-warning/80">Add a new club</p>
                </div>
              </button>
            </div>
          </div>

          {/* Growth Metrics and Other Administrators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">📈 Growth Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Student Growth</span>
                  <span className="text-success font-semibold">+{stats.students} this period</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Club Growth</span>
                  <span className="text-primary font-semibold">+{stats.clubs} this period</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Engagement Rate</span>
                  <span className="text-secondary font-semibold">{getMembershipPercentage()}%</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">👥 Other Administrators</h3>
              <div className="space-y-3">
                {otherAdmins.length > 0 ? (
                  otherAdmins.map((admin) => (
                    <div key={admin.uid} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                      <div>
                        <p className="font-medium text-foreground">{admin.displayName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                      <span className="text-primary text-sm font-semibold">Admin</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">You are the only administrator</p>
                )}
                <div className="pt-2">
                  <button
                    onClick={() => router.push("/admin/school")}
                    className="text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
                  >
                    Manage Admin Access →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}