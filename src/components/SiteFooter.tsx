import lemateLogo from "@/assets/logo_oficial.png";

const c = { cream: "#FAF5EE", muted: "#6B6560", border: "#E8DDD2" };

export function SiteFooter() {
  return (
    <footer
      style={{
        padding: "32px 48px",
        marginTop: 0,
        background: c.cream,
        borderTop: `1px solid ${c.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <img src={lemateLogo} alt="Le Mater" style={{ height: 28, width: "auto" }} />
          <span style={{ fontSize: 12, color: c.muted, letterSpacing: "0.06em" }}>
            © 2024 · Le Mater
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: c.muted, flexWrap: "wrap" }}>
          <span>contato@lemater.com</span>
          <span>Brasil, o país do parto saudável</span>
        </div>
      </div>
    </footer>
  );
}
