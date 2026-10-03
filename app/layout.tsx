import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk, Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-ui',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-brand',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-ai',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#FF6848',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'CampusConnect - Institutional Community & Academic Portal',
  description:
    'Collegiate community platform featuring verified academic notices, student spaces, campus pulse briefing, and contextual campus AI.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CampusConnect',
  },
  openGraph: {
    title: 'CampusConnect - Institutional Community & Academic Portal',
    description:
      'Collegiate community platform featuring verified academic notices, student spaces, campus pulse briefing, and contextual campus AI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusConnect - Institutional Community & Academic Portal',
    description:
      'Collegiate community platform featuring verified academic notices, student spaces, campus pulse briefing, and contextual campus AI.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${sora.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('campusconnect_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="bg-page text-primary text-[14px] font-sans antialiased selection:bg-[#FF6848]/20 selection:text-[#FF6848] transition-colors duration-200"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
