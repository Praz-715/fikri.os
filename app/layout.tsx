import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { profile } from '@/data/profile'
import './globals.css'

const display = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
})

const title = `FIKRI.OS — ${profile.name}`

export const metadata: Metadata = {
  title: {
    default: title,
    template: '%s — FIKRI.OS',
  },
  description: profile.summaryShort,
  applicationName: 'FIKRI.OS',
  authors: [{ name: profile.name, url: profile.links[0].href }],
  keywords: [
    'Fikri Rama Singgih',
    'Data Analytics Engineer',
    'Data Engineer',
    'TigerGraph',
    'Sentiment analysis',
    'Jakarta',
  ],
  openGraph: {
    title,
    description: profile.summaryShort,
    type: 'profile',
    locale: 'en_US',
    siteName: 'FIKRI.OS',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: profile.summaryShort,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#07080a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

/**
 * Structured data. The same facts as `data/profile.ts`, expressed so
 * search engines and LinkedIn previews read them correctly rather than
 * guessing from the 3D page.
 */
function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    description: profile.summaryShort,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jakarta',
      addressCountry: 'ID',
    },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: profile.education[0].institution,
    },
    sameAs: profile.links
      .filter((l) => l.href.startsWith('http'))
      .map((l) => l.href),
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // Serialising our own static object — no user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        {children}
      </body>
    </html>
  )
}
