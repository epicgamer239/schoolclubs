"use client";

import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-6 border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 group">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="StudyHub Logo"
                width={40}
                height={40}
                className="w-10 h-10 group-hover:scale-110"
              />
            </div>
            <span className="text-2xl font-bold text-primary">
              StudyHub
            </span>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn-primary"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between px-6 py-20 max-w-7xl mx-auto gap-16">
        <div className="lg:w-1/2 text-center lg:text-left">
          <div className="mb-6">
            <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🎓 Trusted by 500+ Schools
            </span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Streamline Your School's
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent block">
              Club Management
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            A comprehensive platform for students, teachers, and administrators to create, 
            manage, and participate in school clubs and organizations with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/signup"
              className="btn-primary text-lg px-8 py-4"
            >
              Start Free Trial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/student/clubs"
              className="btn-outline text-lg px-8 py-4"
            >
              View Demo
            </Link>
          </div>
        </div>

        <div className="lg:w-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl"></div>
            <div className="relative card rounded-2xl p-8 border border-border/50 shadow-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-background p-6 rounded-xl border border-border/50 hover:border-primary/30 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Student Clubs</h3>
                  <p className="text-sm text-muted-foreground">Join and participate in exciting activities</p>
                </div>
                <div className="bg-background p-6 rounded-xl border border-border/50 hover:border-secondary/30 group">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary/20">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Teacher Tools</h3>
                  <p className="text-sm text-muted-foreground">Manage and organize club activities</p>
                </div>
                <div className="bg-background p-6 rounded-xl border border-border/50 hover:border-accent-foreground/30 group">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/80">
                    <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Admin Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Oversight and control management</p>
                </div>
                <div className="bg-background p-6 rounded-xl border border-border/50 hover:border-primary/30 group">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/30">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">Analytics</h3>
                  <p className="text-sm text-muted-foreground">Track engagement and growth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Built for Educational Institutions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Trusted by schools nationwide to manage student organizations, 
              track participation, and foster community engagement.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Role-Based Access</h3>
              <p className="text-muted-foreground leading-relaxed">
                Secure, role-specific interfaces for students, teachers, and administrators with granular permissions.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary/20">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Updates</h3>
              <p className="text-muted-foreground leading-relaxed">
                Instant notifications and live updates keep everyone informed about club activities and changes.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Comprehensive Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Detailed insights into club participation, student engagement, and organizational growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/50 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 StudyHub. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
