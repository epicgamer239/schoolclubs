"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../components/AuthContext";
import DashboardTopBar from "../../components/DashboardTopBar";

export default function CalendarPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchCalendarData = async () => {
      if (!userData) return;

      try {
        // Get user's clubs
        const userClubIds = userData.clubIds || [];
        const clubsQuery = query(
          collection(firestore, "clubs"),
          where("schoolId", "==", userData.schoolId)
        );
        const clubsSnap = await getDocs(clubsQuery);
        const clubsList = clubsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((club) => userClubIds.includes(club.id));
        setClubs(clubsList);

        // Get all events from user's clubs
        if (clubsList.length > 0) {
          const eventsQuery = query(
            collection(firestore, "events"),
            where("clubId", "in", clubsList.map(club => club.id))
          );
          const eventsSnap = await getDocs(eventsQuery);
          const eventsList = eventsSnap.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          setEvents(eventsList);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [userData]);

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

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const getEventsForMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const getClubName = (clubId) => {
    const club = clubs.find(c => c.id === clubId);
    return club ? club.name : "Unknown Club";
  };

  const isAttendingEvent = (event) => {
    return event.attendees && event.attendees.includes(userData?.uid);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
          <DashboardTopBar title="Calendar" />
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
        <DashboardTopBar title="Calendar" />
        
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

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">📅 Calendar</h1>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-lg font-semibold">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}

                  {/* Calendar Days */}
                  {getDaysInMonth().map((date, index) => (
                    <div
                      key={index}
                      className={`p-2 min-h-[80px] border border-border/50 ${
                        date ? 'cursor-pointer hover:bg-muted/50' : ''
                      } ${isToday(date) ? 'bg-primary/10 border-primary' : ''} ${
                        isSelectedDate(date) ? 'bg-secondary/20 border-secondary' : ''
                      }`}
                      onClick={() => date && setSelectedDate(date)}
                    >
                      {date && (
                        <>
                          <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                          <div className="space-y-1">
                            {getEventsForDate(date).slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded ${
                                  isAttendingEvent(event) 
                                    ? 'bg-success/20 text-success' 
                                    : 'bg-primary/20 text-primary'
                                }`}
                                title={`${event.title} - ${getClubName(event.clubId)}`}
                              >
                                {event.title}
                              </div>
                            ))}
                            {getEventsForDate(date).length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{getEventsForDate(date).length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Events Sidebar */}
            <div className="space-y-6">
              {/* Selected Date Events */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">
                  📅 {formatDate(selectedDate)}
                </h2>
                
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No events on this date</p>
                ) : (
                  <div className="space-y-4">
                    {getEventsForDate(selectedDate).map((event) => (
                      <div key={event.id} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            isAttendingEvent(event) 
                              ? 'bg-success/20 text-success' 
                              : 'bg-primary/20 text-primary'
                          }`}>
                            {isAttendingEvent(event) ? 'Attending' : 'Not Attending'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                        <div className="space-y-1 mb-3">
                          {event.time && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span className="mr-2">🕒</span>
                              {formatTime(event.time)}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span className="mr-2">📍</span>
                              {event.location}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span className="mr-2">📚</span>
                            {getClubName(event.clubId)}
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/student/clubs/${event.clubId}`)}
                          className="w-full btn-outline text-sm"
                        >
                          View Club
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monthly Summary */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">📊 Monthly Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Events:</span>
                    <span className="font-semibold">{getEventsForMonth().length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Events Attending:</span>
                    <span className="font-semibold text-success">
                      {getEventsForMonth().filter(event => isAttendingEvent(event)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clubs with Events:</span>
                    <span className="font-semibold">
                      {new Set(getEventsForMonth().map(event => event.clubId)).size}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 