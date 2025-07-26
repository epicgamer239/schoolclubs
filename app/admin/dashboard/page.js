// ✅ Combined and updated AdminDashboard and SignupPage with clean logic and safe defaults

// --- AdminDashboard (pages/admin/dashboard/page.js) ---
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/firebase";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import db from "../../../utils/database";
import { cacheUtils } from "../../../utils/cache";

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
  const [otherAdmins, setOtherAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userData?.uid || !userData?.schoolId) return;

      try {
        // Check cache for dashboard stats first
        const cachedStats = cacheUtils.getCachedDashboardStats(userData.schoolId);
        if (cachedStats) {
          setStats(cachedStats.stats);
          setSchool(cachedStats.school);
          setRecentActivity(cachedStats.recentActivity);
          setOtherAdmins(cachedStats.otherAdmins);
          setLoading(false);
          return;
        }

        // Fetch school data with caching
        const schoolData = await db.getDocument("schools", userData.schoolId, true);
        setSchool(schoolData);

        // Fetch all data in parallel with caching
        const [studentsSnap, teachersSnap, clubsSnap, requestsSnap, adminsSnap, schoolRequestsSnap] = await Promise.all([
          db.getDocuments("users", {
            whereClauses: [
              { field: "schoolId", operator: "==", value: userData.schoolId },
              { field: "role", operator: "==", value: "student" }
            ],
            useCache: true
          }),
          db.getDocuments("users", {
            whereClauses: [
              { field: "schoolId", operator: "==", value: userData.schoolId },
              { field: "role", operator: "==", value: "teacher" }
            ],
            useCache: true
          }),
          db.getDocuments("clubs", {
            whereClauses: [{ field: "schoolId", operator: "==", value: userData.schoolId }],
            useCache: true
          }),
          db.getDocuments("joinRequests", {
            whereClauses: [{ field: "status", operator: "==", value: "pending" }],
            useCache: true
          }),
          db.getDocuments("users", {
            whereClauses: [
              { field: "schoolId", operator: "==", value: userData.schoolId },
              { field: "role", operator: "==", value: "admin" }
            ],
            useCache: true
          }),
          db.getDocuments("schoolJoinRequests", {
            whereClauses: [
              { field: "schoolId", operator: "==", value: userData.schoolId },
              { field: "status", operator: "==", value: "pending" }
            ],
            useCache: true
          })
        ]);

        const clubs = clubsSnap.documents;
        const totalMemberships = clubs.reduce((sum, club) => sum + (club.studentIds?.length || 0), 0);
        const activeClubs = clubs.filter(club => (club.studentIds?.length || 0) > 0).length;

        // Get other admins (excluding current user)
        const allAdmins = adminsSnap.documents;
        const otherAdminsList = allAdmins.filter(admin => admin.uid !== userData.uid);
        setOtherAdmins(otherAdminsList);

        const newStats = {
          students: studentsSnap.documents.length,
          teachers: teachersSnap.documents.length,
          clubs: clubsSnap.documents.length,
          totalMemberships,
          activeClubs,
          pendingRequests: requestsSnap.documents.length,
          pendingSchoolRequests: schoolRequestsSnap.documents.length
        };
        setStats(newStats);

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

        // Cache the dashboard data
        cacheUtils.cacheDashboardStats(userData.schoolId, {
          stats: newStats,
          school: schoolData,
          recentActivity: recentClubs,
          otherAdmins: otherAdminsList
        });

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
        <div className="min-h-screen bg-background">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="container">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!school) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="container">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">School Not Found</h2>
                <p className="text-muted-foreground">There was an issue loading your school data.</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <DashboardTopBar title="Admin Dashboard" />

        <div className="container">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span className="font-medium">{school.name}</span>
              <span>•</span>
              <div className="flex items-center space-x-4">
                <span>Student Code: <code className="bg-muted px-3 py-1 rounded-lg text-sm font-mono border border-border">{school.studentJoinCode}</code></span>
                <span>Teacher Code: <code className="bg-muted px-3 py-1 rounded-lg text-sm font-mono border border-border">{school.teacherJoinCode}</code></span>
              </div>
            </div>


          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div
              className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => router.push("/admin/students")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold text-foreground">{stats.students}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => router.push("/admin/teachers")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Teachers</p>
                  <p className="text-3xl font-bold text-foreground">{stats.teachers}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => router.push("/admin/clubs")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clubs</p>
                  <p className="text-3xl font-bold text-foreground">{stats.clubs}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Memberships</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalMemberships}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div
              className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => router.push("/admin/tags")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Manage Tags</p>
                  <p className="text-lg font-semibold text-foreground">Create & Edit Tags</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => router.push("/admin/school")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">School Settings</p>
                  <p className="text-lg font-semibold text-foreground">Manage School</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => router.push("/admin/join-requests")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Join Requests</p>
                  <p className="text-lg font-semibold text-foreground">Review Requests</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div
              className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => router.push("/admin/engagement-insights")}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Engagement Overview</h3>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Student Participation</span>
                    <span className="text-foreground font-semibold">{getMembershipPercentage()}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(getMembershipPercentage(), 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Active Clubs</span>
                    <span className="text-foreground font-semibold">{getActiveClubsPercentage()}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-success h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(getActiveClubsPercentage(), 100)}%` }}
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

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Club Join Requests</p>
                      <p className="text-sm text-muted-foreground">{stats.pendingRequests} pending</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/admin/join-requests")}
                    className="btn-outline text-sm"
                  >
                    Review
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">School Join Requests</p>
                      <p className="text-sm text-muted-foreground">{stats.pendingSchoolRequests} pending</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/admin/school-join-requests")}
                    className="btn-outline text-sm"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((club) => (
                    <div key={club.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{club.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {club.studentIds?.length || 0} members
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/admin/clubs/${club.id}`)}
                        className="btn-ghost text-sm"
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No recent activity</p>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Other Administrators</h3>
              <div className="space-y-3">
                {otherAdmins.length > 0 ? (
                  otherAdmins.map((admin) => (
                    <div key={admin.uid} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{admin.displayName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                      <span className="badge-primary">Admin</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">You are the only administrator</p>
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