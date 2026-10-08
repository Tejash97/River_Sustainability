import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RiverRevive AI - Geospatial River & Waterway Pollution Response Platform',
  description:
    'Community-driven geospatial intelligence platform powered by Google Gemini and OpenStreetMap Overpass. Detect, cluster, and organize targeted cleanup drives along critical riverbanks and waterbodies.',
  keywords: [
    'river cleanup',
    'water pollution',
    'geospatial AI',
    'Google Gemini',
    'Leaflet',
    'Overpass API',
    'environmental hydrology',
    'ocean cleanup',
    'DBSCAN clustering',
  ],
  authors: [{ name: 'RiverRevive AI Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-eco-dark text-slate-100 antialiased selection:bg-eco-cyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
