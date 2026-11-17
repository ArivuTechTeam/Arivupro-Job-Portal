import React from "react";

export const TechStack: React.FC = () => {
  const pageWrapStyle: React.CSSProperties = {
    fontFamily: "'Manrope', sans-serif",
    padding: "32px 24px",
    maxWidth: "800px",
    margin: "0 auto",
    background: "#f9fafb",
    minHeight: "100vh",
  };

  const h1Style: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: 800,
    color: "#0f2419",
    margin: "0 0 6px 0",
    fontFamily: "'Manrope', sans-serif",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 32px 0",
    fontFamily: "'Manrope', sans-serif",
  };

  const layerCardBase: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "20px",
    fontFamily: "'Manrope', sans-serif",
  };

  const layerHeaderStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f2419",
    margin: "0 0 18px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontFamily: "'Manrope', sans-serif",
  };

  const itemsContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  };

  const itemRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    fontSize: "14px",
    color: "#374151",
    fontFamily: "'Manrope', sans-serif",
  };

  const iconCellStyle: React.CSSProperties = {
    width: "32px",
    flexShrink: 0,
    fontSize: "16px",
    lineHeight: "1.4",
  };

  const itemNameStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: "13px",
    color: "#0f2419",
    fontFamily: "'Manrope', sans-serif",
  };

  const dashStyle: React.CSSProperties = {
    margin: "0 5px",
    color: "#9ca3af",
  };

  const itemDescStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#6b7280",
    fontFamily: "'Manrope', sans-serif",
  };

  type StackItem = { icon: string; name: string; desc: string };
  type Layer = {
    icon: string;
    label: string;
    borderColor: string;
    items: StackItem[];
  };

  const layers: Layer[] = [
    {
      icon: "⚛️",
      label: "Frontend",
      borderColor: "#3b82f6",
      items: [
        { icon: "⚛️", name: "React 19", desc: "SPA with hooks, context, and tab-based routing" },
        { icon: "🎨", name: "Tailwind CSS v4", desc: "Utility-first styling with custom design tokens" },
        { icon: "📦", name: "Vite 8", desc: "Build tool + dev server with HMR & API proxy" },
        { icon: "🔷", name: "TypeScript 7", desc: "End-to-end type safety" },
      ],
    },
    {
      icon: "🐍",
      label: "Backend",
      borderColor: "#1a7a4a",
      items: [
        { icon: "🐍", name: "Python / FastAPI", desc: "Async REST API, Pydantic validation, auto Swagger docs" },
        { icon: "🦄", name: "Uvicorn", desc: "ASGI server — production-grade runtime" },
        { icon: "🔌", name: "Supabase SDK", desc: "Python client for DB queries & Storage" },
      ],
    },
    {
      icon: "🐘",
      label: "Database",
      borderColor: "#7c3aed",
      items: [
        { icon: "🐘", name: "PostgreSQL", desc: "Primary database via Supabase" },
        { icon: "🔐", name: "Row Level Security", desc: "Policy-based multi-tenant access control" },
        { icon: "🪣", name: "Supabase Storage", desc: "3 buckets: resumes, job-logos, job-docs" },
      ],
    },
    {
      icon: "✨",
      label: "AI / ML",
      borderColor: "#f59e0b",
      items: [
        { icon: "✨", name: "Gemini 2.0 Flash", desc: "Candidate-job match scoring + interview prep" },
        { icon: "🧠", name: "Course Detection", desc: "Keyword regex + Gemini NLP fallback for scraped jobs" },
      ],
    },
    {
      icon: "🌊",
      label: "Infrastructure",
      borderColor: "#ef4444",
      items: [
        { icon: "🌊", name: "Supabase Auth", desc: "JWT-based auth with httpOnly sessions" },
        { icon: "🔄", name: "Scraper Pipeline", desc: "CA Club India, BuddingCA, JSearch, ICAI, ICMAI" },
        { icon: "🔑", name: "SHA256 Dedup", desc: "Content fingerprinting across all sources" },
        { icon: "📧", name: "Resend Email", desc: "Transactional emails (offer letters, interview alerts)" },
      ],
    },
  ];

  return (
    <div style={pageWrapStyle}>
      {/* Page Header */}
      <h1 style={h1Style}>Tech Stack</h1>
      <p style={subtitleStyle}>
        Full architecture overview — ArivuPro Finance Career Portal
      </p>

      {/* Layer Cards */}
      {layers.map((layer) => (
        <div
          key={layer.label}
          className="card"
          style={{
            ...layerCardBase,
            borderLeft: `4px solid ${layer.borderColor}`,
          }}
        >
          <h2 style={layerHeaderStyle}>
            <span>{layer.icon}</span>
            {layer.label}
          </h2>

          <div style={itemsContainerStyle}>
            {layer.items.map((item) => (
              <div key={item.name} style={itemRowStyle}>
                <span style={iconCellStyle}>{item.icon}</span>
                <span>
                  <span style={itemNameStyle}>{item.name}</span>
                  <span style={dashStyle}>—</span>
                  <span style={itemDescStyle}>{item.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
