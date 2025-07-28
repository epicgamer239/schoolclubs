import React from 'react';

export const metadata = {
  title: "Features - School Club Management",
  description: "Explore all the powerful features StudyHub offers for schools, teachers, and students. Role-based access, real-time updates, analytics, and more.",
  keywords: [
    "school club features",
    "student management",
    "teacher tools",
    "admin dashboard",
    "analytics",
    "real-time updates"
  ],
  openGraph: {
    title: "StudyHub Features - School Club Management",
    description: "Explore all the powerful features StudyHub offers for schools, teachers, and students.",
    images: ["https://clubs4community.app/og-image.png"],
  },
  twitter: {
    title: "StudyHub Features - School Club Management",
    description: "Explore all the powerful features StudyHub offers for schools, teachers, and students.",
  },
};

export default function FeaturesPage() {
  return (
    <>
      {/* Structured Data for Features Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "StudyHub Features",
            "description": "Explore all the powerful features StudyHub offers for schools, teachers, and students",
            "url": "https://clubs4community.app/features",
            "mainEntity": {
              "@type": "ItemList",
              "name": "StudyHub Features",
              "description": "Features for school club management",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Role-Based Access",
                  "description": "Secure, role-specific interfaces for students, teachers, and administrators"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Real-time Updates",
                  "description": "Instant notifications and live updates for club activities"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Analytics Dashboard",
                  "description": "Detailed insights into club participation and student engagement"
                }
              ]
            }
          })
        }}
      />
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-4xl font-bold mb-4">Features</h1>
        <p className="text-lg text-gray-600">Explore all the powerful features StudyHub offers for schools, teachers, and students. (Full details coming soon!)</p>
      </div>
    </>
  );
} 