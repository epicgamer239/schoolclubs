"use client";
import { useState } from "react";
import { useAuth } from "../../components/AuthContext";
import DashboardTopBar from "../../components/DashboardTopBar";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function HelpCenter() {
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  const faqData = {
    general: [
      {
        question: "How do I join a club?",
        answer: "Navigate to the 'Explore Clubs' section from your dashboard. Browse available clubs and click 'Join Club' on any club you're interested in. Some clubs may require approval from a teacher or admin."
      },
      {
        question: "How do I create a club?",
        answer: "Teachers and admins can create clubs. Go to your dashboard and click 'Create Club'. Fill in the club details including name, description, and any tags. Students cannot create clubs directly."
      },
      {
        question: "What are tags?",
        answer: "Tags help categorize clubs by interests or activities. Admins create tags, and teachers can assign multiple tags to their clubs. This helps students find clubs that match their interests."
      },
      {
        question: "How do I join my school?",
        answer: "Use the 'Join School' feature and enter your school's unique join code. You'll need to provide your role (student, teacher, or admin) and wait for approval if required."
      }
    ],
    students: [
      {
        question: "How do I see my attendance for events?",
        answer: "Your attendance status for each event will be displayed on the club page. Teachers mark attendance after events, and you'll see your status (present, absent, late, or excused) below each event."
      },
      {
        question: "Can I leave a club?",
        answer: "Yes, you can leave a club at any time. Go to your dashboard, find the club in your joined clubs section, and click 'Leave Club'."
      },
      {
        question: "How do I RSVP to events?",
        answer: "On the club page, you'll see upcoming events. Click 'Join Event' to RSVP. You can also leave events by clicking 'Leave Event'."
      },
      {
        question: "What if I can't find my school?",
        answer: "Contact your school administrator to get the correct join code. Each school has a unique code that students need to join."
      }
    ],
    teachers: [
      {
        question: "How do I mark attendance for events?",
        answer: "On your club page, you'll see an 'Attendance' button for each event. Click it to open a modal where you can mark each student as present, absent, late, or excused."
      },
      {
        question: "How do I manage join requests?",
        answer: "Go to 'Join Requests' in your dashboard to see pending requests from students wanting to join your clubs. You can approve or deny each request."
      },
      {
        question: "Can I edit club details after creation?",
        answer: "Yes, go to your club page and look for the settings or edit options. You can update the description, tags, and other details."
      },
      {
        question: "How do I create events?",
        answer: "On your club page, click 'Create Event' to add new events. Fill in the title, description, date, time, and location. Events can only be created for future dates."
      }
    ],
    admins: [
      {
        question: "How do I manage tags?",
        answer: "Go to 'Tag Management' in your admin dashboard. You can create, edit, and delete tags. Tags help categorize clubs and make them easier to find."
      },
      {
        question: "How do I approve school join requests?",
        answer: "Go to 'School Join Requests' in your admin dashboard to see pending requests. You can approve or deny requests from users wanting to join your school."
      },
      {
        question: "How do I manage clubs?",
        answer: "Use the 'Club Management' section to view all clubs in your school. You can see club details, members, and manage club settings."
      },
      {
        question: "How do I add authorized admins?",
        answer: "In school settings, you can add email addresses of users who should have admin privileges. These users will be able to manage the school once they join."
      }
    ],
    technical: [
      {
        question: "What browsers are supported?",
        answer: "We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, use the latest version of your browser."
      },
      {
        question: "How do I reset my password?",
        answer: "Use the 'Forgot Password' option on the login page. You'll receive an email with instructions to reset your password."
      },
      {
        question: "Is my data secure?",
        answer: "Yes, we use industry-standard security measures to protect your data. All information is encrypted and stored securely in Firebase."
      },
      {
        question: "What if I can't log in?",
        answer: "First, check that you're using the correct email and password. If you're still having issues, contact your school administrator or use the contact form below."
      }
    ]
  };

  const filteredFAQs = Object.entries(faqData).reduce((acc, [category, questions]) => {
    if (searchTerm) {
      const filtered = questions.filter(q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
    } else {
      acc[category] = questions;
    }
    return acc;
  }, {});

  const categories = [
    { id: "general", name: "General", icon: "🏠" },
    { id: "students", name: "Students", icon: "👨‍🎓" },
    { id: "teachers", name: "Teachers", icon: "👨‍🏫" },
    { id: "admins", name: "Administrators", icon: "👨‍💼" },
    { id: "technical", name: "Technical", icon: "⚙️" }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Help Center" />
        
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Help Center</h1>
            <p className="text-muted-foreground mb-6">
              Find answers to common questions and get support for using the club management system.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full pl-10"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* FAQ Content */}
          <div className="space-y-6">
            {Object.entries(filteredFAQs).map(([category, questions]) => (
              <div key={category} className="card p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>{categories.find(c => c.id === category)?.icon}</span>
                  {categories.find(c => c.id === category)?.name} Questions
                </h2>
                
                <div className="space-y-4">
                  {questions.map((faq, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="card p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">Still Need Help?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Contact Your School Administrator</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  For school-specific issues, account problems, or technical support, contact your school administrator.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> admin@yourschool.edu</p>
                  <p><strong>Phone:</strong> (555) 123-4567</p>
                  <p><strong>Office Hours:</strong> Monday-Friday, 8:00 AM - 4:00 PM</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">System Support</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  For technical issues, bugs, or feature requests, contact our support team.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> support@clubmanager.com</p>
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                  <p><strong>Support Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM EST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="card p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Quick Links</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>
              <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a>
              <a href="/student/dashboard" className="text-primary hover:underline">Student Dashboard</a>
              <a href="/teacher/dashboard" className="text-primary hover:underline">Teacher Dashboard</a>
              <a href="/admin/dashboard" className="text-primary hover:underline">Admin Dashboard</a>
              <a href="/calendar" className="text-primary hover:underline">Calendar</a>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 