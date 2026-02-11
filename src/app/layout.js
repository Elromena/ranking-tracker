export const metadata = {
  title: "Ranking Tracker — blockchain-ads.com",
  description: "SEO keyword ranking tracker for blockchain-ads.com",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; color: #0f172a; -webkit-font-smoothing: antialiased; }
          ::selection { background: #2563eb; color: #fff; }
          input:focus, select:focus { outline: none; border-color: #2563eb !important; }
          button:hover { opacity: 0.92; }
          table { font-variant-numeric: tabular-nums; }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
