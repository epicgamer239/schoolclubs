import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";
import BrowserBlocker from "../components/BrowserBlocker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL('https://clubs4community.app'),
  title: {
    default: "StudyHub - School Club Management Platform",
    template: "%s | StudyHub"
  },
  description: "A comprehensive platform for managing school clubs and activities. Join 500+ schools using StudyHub to streamline club management, track participation, and foster student engagement.",
  keywords: [
    "school club management",
    "student organizations",
    "education technology",
    "school activities",
    "club management software",
    "student engagement",
    "school administration",
    "educational platform"
  ],
  authors: [{ name: "StudyHub Team" }],
  creator: "StudyHub",
  publisher: "StudyHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clubs4community.app",
    siteName: "StudyHub",
    title: "StudyHub - School Club Management Platform",
    description: "A comprehensive platform for managing school clubs and activities. Join 500+ schools using StudyHub to streamline club management, track participation, and foster student engagement.",
    images: [
      {
        url: "https://clubs4community.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudyHub - School Club Management Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyHub - School Club Management Platform",
    description: "A comprehensive platform for managing school clubs and activities. Join 500+ schools using StudyHub.",
    images: ["https://clubs4community.app/og-image.png"],
    creator: "@studyhub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: "https://clubs4community.app",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "StudyHub",
              "description": "A comprehensive platform for managing school clubs and activities",
              "url": "https://clubs4community.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://clubs4community.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "StudyHub",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://clubs4community.app/logo.png"
                }
              }
            })
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <BrowserBlocker>{children}</BrowserBlocker>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
