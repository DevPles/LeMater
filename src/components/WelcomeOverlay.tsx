import logoMonograma from "@/assets/logo_monograma.png";

const CREAM = "#f5efe2";
const GREEN_DEEP = "#234735";
const GOLD = "#c9a24a";

export function WelcomeOverlay({
  title = "Bem-vinda de volta",
  subtitle = "Login realizado com sucesso",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="login-success-overlay" role="status" aria-live="polite">
      <div className="login-success-bg" aria-hidden="true">
        <span className="ls-orb ls-orb-1" />
        <span className="ls-orb ls-orb-2" />
        <span className="ls-orb ls-orb-3" />
      </div>
      <div className="login-success-card">
        <div className="ls-ring">
          <span className="ls-ring-spin" aria-hidden="true" />
          <span className="ls-ring-pulse" aria-hidden="true" />
          <img src={logoMonograma} alt="Le Mater" className="ls-logo" />
        </div>
        <h2 className="ls-title">{title}</h2>
        <p className="ls-subtitle">{subtitle}</p>
        <div className="ls-progress" aria-hidden="true">
          <span />
        </div>
      </div>
      <style>{css}</style>
    </div>
  );
}

const css = `
.login-success-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, ${GREEN_DEEP} 0%, #0f2419 100%);
  animation: lsFadeIn 0.45s ease-out;
  overflow: hidden;
}
.login-success-bg { position: absolute; inset: 0; pointer-events: none; }
.ls-orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.55; }
.ls-orb-1 { width: 360px; height: 360px; background: ${GOLD}; top: -80px; left: -60px; animation: lsFloat 6s ease-in-out infinite; }
.ls-orb-2 { width: 300px; height: 300px; background: #3a6a4e; bottom: -60px; right: -40px; animation: lsFloat 7s ease-in-out infinite reverse; }
.ls-orb-3 { width: 220px; height: 220px; background: ${GOLD}; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.18; animation: lsPulseGlow 3s ease-in-out infinite; }
.login-success-card {
  position: relative; display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 36px 32px;
  animation: lsRise 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
.ls-ring { position: relative; width: 132px; height: 132px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
.ls-ring-spin {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid transparent; border-top-color: ${GOLD}; border-right-color: ${GOLD};
  animation: lsSpin 1.6s linear infinite;
  box-shadow: 0 0 28px rgba(201, 162, 74, 0.35);
}
.ls-ring-pulse { position: absolute; inset: 10px; border-radius: 50%; border: 1px solid rgba(201, 162, 74, 0.4); animation: lsRingPulse 2s ease-out infinite; }
.ls-logo {
  width: 84px; height: 84px; object-fit: contain;
  animation: lsPopIn 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.4) both;
  filter: drop-shadow(0 4px 18px rgba(201, 162, 74, 0.45));
}
.ls-title { margin: 0; font-family: var(--font-display); font-size: 26px; font-weight: 600; color: ${CREAM}; letter-spacing: 0.01em; animation: lsFadeUp 0.6s ease-out 0.2s both; }
.ls-subtitle { margin: 8px 0 22px; font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: ${GOLD}; animation: lsFadeUp 0.6s ease-out 0.32s both; }
.ls-progress { width: 180px; height: 2px; border-radius: 2px; background: rgba(201, 162, 74, 0.18); overflow: hidden; }
.ls-progress > span { display: block; height: 100%; background: linear-gradient(90deg, transparent, ${GOLD}, transparent); animation: lsProgress 1.6s ease-in-out infinite; }

@keyframes lsFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes lsRise { from { opacity: 0; transform: translateY(14px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes lsPopIn { 0% { opacity: 0; transform: scale(0.4); } 60% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes lsSpin { to { transform: rotate(360deg); } }
@keyframes lsRingPulse { 0% { transform: scale(0.96); opacity: 0.75; } 100% { transform: scale(1.18); opacity: 0; } }
@keyframes lsFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lsProgress { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
@keyframes lsFloat { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(20px, -20px); } }
@keyframes lsPulseGlow { 0%, 100% { opacity: 0.18; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.32; transform: translate(-50%, -50%) scale(1.1); } }
`;
