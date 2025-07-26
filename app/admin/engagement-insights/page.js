"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  doc, getDoc, collection, getDocs, query, where, orderBy, limit
} from "firebase/firestore";
import DashboardTopBar from "../../../components/DashboardTopBar";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";

export default function EngagementInsightsPage() {
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    clubs: 0,
    totalMemberships: 0,
    activeClubs: 0,
    inactiveClubs: 0,
    topClubs: [],
    studentParticipation: 0,
    averageMembersPerClub: 0,
    mostActiveStudents: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30"); // days
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchEngagementData = async () => {
      if (!userData?.uid || !userData?.schoolId) return;

      try {
        // Fetch school data
        const schoolDoc = await getDoc(doc(firestore, "schools", userData.schoolId));
        if (schoolDoc.exists()) {
          const schoolData = { id: userData.schoolId, ...schoolDoc.data() };
          setSchool(schoolData);
        }

        const usersRef = collection(firestore, "users");
        const clubsRef = collection(firestore, "clubs");

        // Fetch all data in parallel
        const [studentsSnap, teachersSnap, clubsSnap] = await Promise.all([
          getDocs(query(usersRef, where("schoolId", "==", userData.schoolId), where("role", "==", "student"))),
          getDocs(query(usersRef, where("schoolId", "==", userData.schoolId), where("role", "==", "teacher"))),
          getDocs(query(clubsRef, where("schoolId", "==", userData.schoolId)))
        ]);

        const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const teachers = teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const clubs = clubsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculate engagement metrics
        const totalMemberships = clubs.reduce((sum, club) => sum + (club.studentIds?.length || 0), 0);
        const activeClubs = clubs.filter(club => (club.studentIds?.length || 0) > 0);
        const inactiveClubs = clubs.filter(club => (club.studentIds?.length || 0) === 0);
        
        // Top clubs by membership
        const topClubs = clubs
          .filter(club => (club.studentIds?.length || 0) > 0)
          .sort((a, b) => (b.studentIds?.length || 0) - (a.studentIds?.length || 0))
          .slice(0, 5);

        // Student participation rate
        const studentParticipation = students.length > 0 ? 
          Math.round((totalMemberships / students.length) * 100) : 0;

        // Average members per club
        const averageMembersPerClub = clubs.length > 0 ? 
          Math.round(totalMemberships / clubs.length) : 0;

        // Most active students (students in most clubs)
        const studentClubCounts = {};
        clubs.forEach(club => {
          club.studentIds?.forEach(studentId => {
            studentClubCounts[studentId] = (studentClubCounts[studentId] || 0) + 1;
          });
        });

        const mostActiveStudents = students
          .filter(student => studentClubCounts[student.uid])
          .map(student => ({
            ...student,
            clubCount: studentClubCounts[student.uid]
          }))
          .sort((a, b) => b.clubCount - a.clubCount)
          .slice(0, 5);

        // Recent activity (recently created clubs)
        const recentActivity = clubs
          .sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return b.createdAt.toDate() - a.createdAt.toDate();
            }
            return 0;
          })
          .slice(0, 10);

        setStats({
          students: students.length,
          teachers: teachers.length,
          clubs: clubs.length,
          totalMemberships,
          activeClubs: activeClubs.length,
          inactiveClubs: inactiveClubs.length,
          topClubs,
          studentParticipation,
          averageMembersPerClub,
          mostActiveStudents,
          recentActivity
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching engagement data:", error);
        setLoading(false);
      }
    };

    if (!authLoading && userData) {
      fetchEngagementData();
    }
  }, [userData, authLoading, timeRange]);

  const getEngagementLevel = (percentage) => {
    if (percentage >= 80) return { level: "Excellent", color: "text-success", bg: "bg-success/10" };
    if (percentage >= 60) return { level: "Good", color: "text-warning", bg: "bg-warning/10" };
    if (percentage >= 40) return { level: "Fair", color: "text-orange-500", bg: "bg-orange-500/10" };
    return { level: "Needs Improvement", color: "text-destructive", bg: "bg-destructive/10" };
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background">
          <DashboardTopBar title="Engagement Insights" />
          <div className="container">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <DashboardTopBar title="Engagement Insights" />
        
        <div className="container">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Engagement Insights</h1>
                <p className="text-muted-foreground">Detailed analytics and engagement metrics for {school?.name}</p>
              </div>
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="btn-outline"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Student Participation</p>
                  <p className="text-3xl font-bold text-foreground">{stats.studentParticipation}%</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${getEngagementLevel(stats.studentParticipation).bg} ${getEngagementLevel(stats.studentParticipation).color}`}>
                {getEngagementLevel(stats.studentParticipation).level}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Clubs</p>
                  <p className="text-3xl font-bold text-foreground">{stats.activeClubs}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.inactiveClubs} inactive
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Members/Club</p>
                  <p className="text-3xl font-bold text-foreground">{stats.averageMembersPerClub}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.totalMemberships} total memberships
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold text-foreground">{stats.students}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.teachers} teachers
              </p>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Performing Clubs */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performing Clubs</h3>
              <div className="space-y-4">
                {stats.topClubs.length > 0 ? (
                  stats.topClubs.map((club, index) => (
                    <div key={club.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-primary'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{club.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {club.studentIds?.length || 0} members
                          </p>
                        </div>
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
                  <p className="text-muted-foreground text-center py-8">No active clubs</p>
                )}
              </div>
            </div>

            {/* Most Active Students */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Most Active Students</h3>
              <div className="space-y-4">
                {stats.mostActiveStudents.length > 0 ? (
                  stats.mostActiveStudents.map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-primary'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.displayName || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.clubCount} clubs
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => router.push(`/admin/students/${student.id}`)}
                        className="btn-ghost text-sm"
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No active students</p>
                )}
              </div>
            </div>
          </div>

          {/* Engagement Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Participation Breakdown */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Participation Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Students in Clubs</span>
                    <span className="text-foreground font-semibold">
                      {Math.round((stats.totalMemberships / Math.max(stats.students, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((stats.totalMemberships / Math.max(stats.students, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Active Clubs</span>
                    <span className="text-foreground font-semibold">
                      {stats.clubs > 0 ? Math.round((stats.activeClubs / stats.clubs) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-success h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(stats.clubs > 0 ? (stats.activeClubs / stats.clubs) * 100 : 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Average Engagement</span>
                    <span className="text-foreground font-semibold">
                      {Math.round((stats.studentParticipation + (stats.clubs > 0 ? (stats.activeClubs / stats.clubs) * 100 : 0)) / 2)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-warning h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((stats.studentParticipation + (stats.clubs > 0 ? (stats.activeClubs / stats.clubs) * 100 : 0)) / 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Club Activity</h3>
              <div className="space-y-4">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((club) => (
                    <div key={club.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{club.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {club.studentIds?.length || 0} members • Created recently
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
          </div>

          {/* Recommendations */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Engagement Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.studentParticipation < 50 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-blue-800">Low Participation</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Consider promoting clubs more actively to increase student engagement.
                  </p>
                </div>
              )}

              {stats.inactiveClubs > stats.activeClubs && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-semibold text-orange-800">Many Inactive Clubs</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Review and potentially consolidate inactive clubs to improve engagement.
                  </p>
                </div>
              )}

              {stats.averageMembersPerClub < 5 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-green-800">Growth Opportunity</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Encourage students to join multiple clubs to increase average participation.
                  </p>
                </div>
              )}

              {stats.studentParticipation >= 70 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="font-semibold text-purple-800">Excellent Engagement</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Your school has excellent student participation! Keep up the great work.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 