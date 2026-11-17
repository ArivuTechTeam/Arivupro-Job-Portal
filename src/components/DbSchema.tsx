import React from "react";

export const DbSchema: React.FC = () => {
  const pageHeaderStyle: React.CSSProperties = {
    fontFamily: "'Manrope', sans-serif",
    marginBottom: "32px",
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
    margin: 0,
    fontFamily: "'Manrope', sans-serif",
  };

  const sectionCardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "24px",
    fontFamily: "'Manrope', sans-serif",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f2419",
    margin: "0 0 20px 0",
    fontFamily: "'Manrope', sans-serif",
  };

  const entityBoxStyle: React.CSSProperties = {
    background: "#f0faf4",
    border: "1px solid #1a7a4a",
    borderRadius: "10px",
    padding: "10px 16px",
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  };

  const entityNameStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: "13px",
    color: "#0f2419",
    fontFamily: "'Manrope', sans-serif",
  };

  const entitySubStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#6b7280",
    fontFamily: "'Manrope', sans-serif",
  };

  const arrowStyle: React.CSSProperties = {
    fontSize: "18px",
    color: "#1a7a4a",
    fontWeight: 700,
    alignSelf: "center",
    padding: "0 8px",
  };

  const erRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px",
  };

  const relLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#6b7280",
    fontFamily: "'Manrope', sans-serif",
    fontStyle: "italic",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
  };

  const tableCardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    overflow: "hidden",
    fontFamily: "'Manrope', sans-serif",
  };

  const tableHeaderStyle: React.CSSProperties = {
    borderLeft: "4px solid #1a7a4a",
    padding: "16px 20px 14px 16px",
    borderBottom: "1px solid #f3f4f6",
  };

  const tableNameStyle: React.CSSProperties = {
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f2419",
    margin: "0 0 2px 0",
    fontFamily: "'Manrope', sans-serif",
  };

  const tableDescStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
    fontFamily: "'Manrope', sans-serif",
  };

  const colListStyle: React.CSSProperties = {
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };

  const colRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "3px 0",
  };

  const colNameStyle: React.CSSProperties = {
    fontFamily: "'Courier New', Courier, monospace",
    fontWeight: 700,
    fontSize: "13px",
    color: "#0f2419",
    minWidth: "160px",
    flexShrink: 0,
  };

  const typePillStyle: React.CSSProperties = {
    background: "#f3f4f6",
    color: "#374151",
    fontSize: "10px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "999px",
    fontFamily: "'Manrope', sans-serif",
    whiteSpace: "nowrap",
  };

  const noteStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#1a7a4a",
    fontWeight: 600,
    fontFamily: "'Manrope', sans-serif",
    whiteSpace: "nowrap",
  };

  type Col = { name: string; type: string; note?: string };

  const renderColumns = (cols: Col[]) => (
    <div style={colListStyle}>
      {cols.map((col) => (
        <div key={col.name} style={colRowStyle}>
          <span style={colNameStyle}>{col.name}</span>
          <span className="badge" style={typePillStyle}>{col.type}</span>
          {col.note && <span style={noteStyle}>{col.note}</span>}
        </div>
      ))}
    </div>
  );

  const jobsCols: Col[] = [
    { name: "id", type: "uuid", note: "PK" },
    { name: "title", type: "text" },
    { name: "company", type: "text" },
    { name: "job_type", type: "enum" },
    { name: "workplace_type", type: "enum" },
    { name: "status", type: "text" },
    { name: "qualifications", type: "text[]" },
    { name: "mandatory_skills", type: "text[]" },
    { name: "salary_min_lpa", type: "numeric" },
    { name: "stipend_monthly", type: "numeric" },
    { name: "source", type: "text" },
    { name: "external_id", type: "text" },
    { name: "content_fingerprint", type: "text", note: "SHA256" },
    { name: "arivupro_exclusive", type: "boolean" },
    { name: "is_urgent", type: "boolean" },
    { name: "applicants_count", type: "integer" },
    { name: "posted_date", type: "date" },
    { name: "deadline_date", type: "date" },
  ];

  const studentLeadsCols: Col[] = [
    { name: "id", type: "uuid", note: "PK" },
    { name: "job_id", type: "uuid", note: "FK → jobs" },
    { name: "student_name", type: "text" },
    { name: "student_email", type: "text" },
    { name: "student_phone", type: "text" },
    { name: "student_id", type: "text" },
    { name: "primary_course", type: "text" },
    { name: "resume_url", type: "text" },
    { name: "ai_match_score", type: "integer" },
    { name: "match_grade", type: "text" },
    { name: "stage", type: "text" },
    { name: "status", type: "text" },
    { name: "crm_sync_status", type: "text" },
    { name: "assigned_counselor", type: "text" },
    { name: "interview_date", type: "timestamp" },
    { name: "timeline", type: "jsonb" },
  ];

  const companyLeadsCols: Col[] = [
    { name: "id", type: "uuid", note: "PK" },
    { name: "company_name", type: "text" },
    { name: "legal_name", type: "text" },
    { name: "work_email", type: "text" },
    { name: "contact_person", type: "text" },
    { name: "cin_or_gstin", type: "text" },
    { name: "verification_status", type: "text" },
    { name: "active_jobs_count", type: "integer" },
    { name: "status", type: "text" },
    { name: "industry", type: "text" },
    { name: "notes", type: "text" },
    { name: "registered_date", type: "date" },
  ];

  const syncRunsCols: Col[] = [
    { name: "id", type: "uuid", note: "PK" },
    { name: "source", type: "text" },
    { name: "started_at", type: "timestamp" },
    { name: "finished_at", type: "timestamp" },
    { name: "status", type: "text" },
    { name: "fetched", type: "integer" },
    { name: "created", type: "integer" },
    { name: "updated", type: "integer" },
    { name: "duplicates", type: "integer" },
    { name: "error_msg", type: "text" },
  ];

  const authUsersCols: Col[] = [
    { name: "id", type: "uuid", note: "PK" },
    { name: "email", type: "text" },
    { name: "role", type: "text" },
    { name: "created_at", type: "timestamp" },
    { name: "last_sign_in_at", type: "timestamp" },
  ];

  const adminUsersCols: Col[] = [
    { name: "id", type: "uuid", note: "PK · FK → auth.users" },
    { name: "email", type: "text" },
    { name: "name", type: "text" },
    { name: "role", type: "text", note: "admin / counselor" },
    { name: "created_at", type: "timestamp" },
  ];

  return (
    <div
      style={{
        fontFamily: "'Manrope', sans-serif",
        padding: "32px 24px",
        maxWidth: "1100px",
        margin: "0 auto",
        background: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      {/* Page Header */}
      <div style={pageHeaderStyle}>
        <h1 style={h1Style}>Database Schema</h1>
        <p style={subtitleStyle}>
          PostgreSQL via Supabase — 6 tables with RLS enabled
        </p>
      </div>

      {/* Section 1: Entity Relationships */}
      <div style={sectionCardStyle}>
        <h2 style={cardTitleStyle}>Entity Relationships</h2>

        <div style={erRowStyle}>
          <div style={entityBoxStyle}>
            <span style={entityNameStyle}>👤 auth.users</span>
            <span style={entitySubStyle}>Supabase Auth</span>
          </div>
          <span style={arrowStyle}>←</span>
          <span style={{ ...arrowStyle, fontSize: "11px", color: "#6b7280", padding: 0 }}>1:1</span>
          <span style={arrowStyle}>→</span>
          <div style={entityBoxStyle}>
            <span style={entityNameStyle}>⚙️ admin_users</span>
            <span style={entitySubStyle}>Portal Staff</span>
          </div>
        </div>

        <div style={erRowStyle}>
          <div style={entityBoxStyle}>
            <span style={entityNameStyle}>💼 jobs</span>
            <span style={entitySubStyle}>Job Listings</span>
          </div>
          <span style={arrowStyle}>←</span>
          <span style={{ ...arrowStyle, fontSize: "11px", color: "#6b7280", padding: 0 }}>1:N</span>
          <span style={arrowStyle}>→</span>
          <div style={entityBoxStyle}>
            <span style={entityNameStyle}>🎓 student_leads</span>
            <span style={entitySubStyle}>Applications</span>
          </div>
          <span style={{ ...relLabelStyle, marginLeft: "4px" }}>(Applications)</span>
        </div>

        <div style={erRowStyle}>
          <div style={entityBoxStyle}>
            <span style={entityNameStyle}>🏢 company_leads</span>
            <span style={entitySubStyle}>Recruiters</span>
          </div>
          <span style={{ margin: "0 12px", color: "#9ca3af", fontSize: "13px" }}>independent</span>
          <div style={entityBoxStyle}>
            <span style={entityNameStyle}>🔄 sync_runs</span>
            <span style={entitySubStyle}>Scraper Audit Log</span>
          </div>
        </div>
      </div>

      {/* Section 2: Schema Table Cards */}
      <div style={gridStyle}>

        {/* Table 1: jobs */}
        <div className="card" style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <p style={tableNameStyle}>💼 jobs</p>
            <p style={tableDescStyle}>All job listings — exclusive + scraped</p>
          </div>
          {renderColumns(jobsCols)}
        </div>

        {/* Table 2: student_leads */}
        <div className="card" style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <p style={tableNameStyle}>🎓 student_leads</p>
            <p style={tableDescStyle}>Student applications & placement pipeline</p>
          </div>
          {renderColumns(studentLeadsCols)}
        </div>

        {/* Table 3: company_leads */}
        <div className="card" style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <p style={tableNameStyle}>🏢 company_leads</p>
            <p style={tableDescStyle}>Recruiter companies & verification</p>
          </div>
          {renderColumns(companyLeadsCols)}
        </div>

        {/* Table 4: sync_runs */}
        <div className="card" style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <p style={tableNameStyle}>🔄 sync_runs</p>
            <p style={tableDescStyle}>Scraper audit log</p>
          </div>
          {renderColumns(syncRunsCols)}
        </div>

        {/* Table 5: auth.users */}
        <div className="card" style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <p style={tableNameStyle}>👤 auth.users</p>
            <p style={tableDescStyle}>Supabase managed auth</p>
          </div>
          {renderColumns(authUsersCols)}
        </div>

        {/* Table 6: admin_users */}
        <div className="card" style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <p style={tableNameStyle}>⚙️ admin_users</p>
            <p style={tableDescStyle}>Portal staff & counselors</p>
          </div>
          {renderColumns(adminUsersCols)}
        </div>

      </div>
    </div>
  );
};
