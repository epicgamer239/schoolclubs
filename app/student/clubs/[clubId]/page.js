"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../components/AuthContext";
import DashboardTopBar from "../../../../components/DashboardTopBar";
import Image from "next/image";

export default function StudentClubPage() {
  const { clubId } = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [joiningEvent, setJoiningEvent] = useState(null);
  const [leavingEvent, setLeavingEvent] = useState(null);

  useEffect(() => {
    const fetchClubData = async () => {
      if (!userData || !clubId) return;

      try {
        // Fetch club details
        const clubDoc = await getDoc(doc(firestore, "clubs", clubId));
        if (!clubDoc.exists()) {
          router.push("/student/dashboard");
          return;
        }

        const clubData = { id: clubDoc.id, ...clubDoc.data() };
        setClub(clubData);

        // Fetch members
        if (clubData.studentIds && clubData.studentIds.length > 0) {
          const membersQuery = query(
            collection(firestore, "users"),
            where("uid", "in", clubData.studentIds)
          );
          const membersSnap = await getDocs(membersQuery);
          const membersList = membersSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMembers(membersList);
        }

        // Fetch events
        const eventsQuery = query(
          collection(firestore, "events"),
          where("clubId", "==", clubId)
        );
        const eventsSnap = await getDocs(eventsQuery);
        const eventsList = eventsSnap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(event => event.date >= new Date().toISOString().split('T')[0])
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(eventsList);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching club data:", error);
        setLoading(false);
      }
    };

    fetchClubData();
  }, [clubId, userData, router]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!userData || !club) return;

    // Validate date is not in the past
    const selectedDate = new Date(newEvent.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert("Cannot create events in the past. Please select a future date.");
      return;
    }

    try {
      // Check for duplicate events with same title, date, and time
      const existingEventsQuery = query(
        collection(firestore, "events"),
        where("clubId", "==", clubId),
        where("title", "==", newEvent.title.trim()),
        where("date", "==", newEvent.date)
      );
      const existingEventsSnapshot = await getDocs(existingEventsQuery);
      
      // Check if an event with same title, date, and time exists
      const duplicateEvent = existingEventsSnapshot.docs.find(doc => {
        const eventData = doc.data();
        return eventData.time === newEvent.time;
      });
      
      if (duplicateEvent) {
        alert("An event with this title, date, and time already exists. Please choose different details.");
        return;
      }

      const eventData = {
        ...newEvent,
        clubId,
        createdBy: userData.uid,
        createdAt: serverTimestamp(),
        attendees: [],
      };

      await addDoc(collection(firestore, "events"), eventData);
      
      // Reset form and close modal
      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
      });
      setShowCreateEvent(false);

      // Refresh events
      const eventsQuery = query(
        collection(firestore, "events"),
        where("clubId", "==", clubId)
      );
      const eventsSnap = await getDocs(eventsQuery);
      const eventsList = eventsSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(event => event.date >= new Date().toISOString().split('T')[0])
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(eventsList);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleJoinEvent = async (eventId) => {
    if (!userData || joiningEvent) return;

    setJoiningEvent(eventId);

    try {
      await updateDoc(doc(firestore, "events", eventId), {
        attendees: arrayUnion(userData.uid),
      });

      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, attendees: [...(event.attendees || []), userData.uid] }
          : event
      ));
    } catch (error) {
      console.error("Error joining event:", error);
    } finally {
      setJoiningEvent(null);
    }
  };

  const handleLeaveEvent = async (eventId) => {
    if (!userData || leavingEvent) return;

    setLeavingEvent(eventId);

    try {
      await updateDoc(doc(firestore, "events", eventId), {
        attendees: arrayRemove(userData.uid),
      });

      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, attendees: (event.attendees || []).filter(id => id !== userData.uid) }
          : event
      ));
    } catch (error) {
      console.error("Error leaving event:", error);
    } finally {
      setLeavingEvent(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString;
  };

  const canManageEvents = () => {
    return userData?.role === "admin" || 
           userData?.role === "teacher" || 
           club?.leaderId === userData?.uid;
  };

  const isAttendingEvent = (event) => {
    return event.attendees && event.attendees.includes(userData?.uid);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="min-h-screen bg-background text-foreground">
          <DashboardTopBar title="Club Details" />
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!club) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="min-h-screen bg-background text-foreground">
          <DashboardTopBar title="Club Details" />
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Club Not Found</h1>
              <button
                onClick={() => router.push("/student/dashboard")}
                className="btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Club Details" />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/student/dashboard")}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Club Header */}
              <div className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{club.name}</h1>
                    <p className="text-muted-foreground text-lg">{club.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-primary">
                      {club.studentIds?.length || 0} members
                    </span>
                    {club.leaderId === userData?.uid && (
                      <span className="badge-primary">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Leader
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{club.studentIds?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{events.length}</div>
                    <div className="text-sm text-muted-foreground">Upcoming Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {formatDate(club.createdAt?.toDate?.() || new Date())}
                    </div>
                    <div className="text-sm text-muted-foreground">Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {club.joinType === "request" ? "Request" : "Open"}
                    </div>
                    <div className="text-sm text-muted-foreground">Join Type</div>
                  </div>
                </div>
              </div>

              {/* Members Section */}
              <div className="card p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Members
                </h2>
                {members.length === 0 ? (
                  <p className="text-muted-foreground">No members yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        {member.photoURL ? (
                          <Image
                            src={member.photoURL}
                            alt="Member"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full border border-border"
                            unoptimized
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                            {(member.displayName || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {member.displayName || member.email}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Events Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upcoming Events
                  </h2>
                  {canManageEvents() && (
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="btn-primary text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Event
                    </button>
                  )}
                </div>

                {events.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No upcoming events</p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <span className="text-xs text-muted-foreground">
                            {event.attendees?.length || 0} attending
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(event.date)}
                          </div>
                          {event.time && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTime(event.time)}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {event.location}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => isAttendingEvent(event) 
                            ? handleLeaveEvent(event.id) 
                            : handleJoinEvent(event.id)
                          }
                          disabled={joiningEvent === event.id || leavingEvent === event.id}
                          className={`w-full text-sm ${
                            isAttendingEvent(event) 
                              ? "btn-outline" 
                              : "btn-primary"
                          } ${(joiningEvent === event.id || leavingEvent === event.id) ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {joiningEvent === event.id ? "Joining..." : 
                           leavingEvent === event.id ? "Leaving..." :
                           isAttendingEvent(event) ? "Leave Event" : "Join Event"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Event Modal */}
        {showCreateEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-xl p-6 max-w-md w-full border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create Event</h2>
                <button
                  onClick={() => setShowCreateEvent(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="input w-full h-24 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time</label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location (Optional)</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Room 101, Gym, etc."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateEvent(false)}
                    className="btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 