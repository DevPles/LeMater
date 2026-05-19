/**
 * Logos oficiais das redes sociais como SVG inline.
 * Cores oficiais de marca preservadas.
 */

type IconProps = { className?: string; size?: number };

export function WhatsAppIcon({ className, size = 22 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#25D366"
        d="M16.001 2.667C8.638 2.667 2.668 8.637 2.668 16c0 2.36.62 4.667 1.797 6.703L2.668 29.333l6.797-1.78A13.27 13.27 0 0 0 16 29.333c7.364 0 13.333-5.97 13.333-13.333S23.365 2.667 16.001 2.667Z"
      />
      <path
        fill="#FFFFFF"
        d="M22.96 19.61c-.34-.17-2.013-.993-2.325-1.107-.312-.114-.539-.17-.766.17-.227.34-.879 1.107-1.078 1.334-.198.227-.397.255-.737.085-.34-.17-1.435-.529-2.733-1.687-1.01-.9-1.692-2.013-1.89-2.353-.198-.34-.021-.524.149-.693.153-.152.34-.397.51-.595.17-.198.227-.34.34-.567.114-.227.057-.425-.028-.595-.085-.17-.766-1.847-1.05-2.53-.276-.663-.557-.573-.766-.583l-.652-.012a1.252 1.252 0 0 0-.907.425c-.312.34-1.191 1.163-1.191 2.84 0 1.677 1.219 3.297 1.388 3.524.17.227 2.4 3.665 5.812 5.142.812.351 1.446.561 1.94.717.815.26 1.557.223 2.143.135.654-.097 2.013-.823 2.298-1.617.283-.794.283-1.475.198-1.617-.085-.142-.312-.227-.652-.397Z"
      />
    </svg>
  );
}

export function InstagramIcon({ className, size = 22 }: IconProps) {
  const id = "ig-grad";
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id} cx="0.3" cy="1" r="1.2">
          <stop offset="0%" stopColor="#FFD976" />
          <stop offset="20%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="80%" stopColor="#8134AF" />
          <stop offset="100%" stopColor="#515BD4" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <path
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        d="M11 7h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4Z"
      />
      <circle cx="16" cy="16" r="4.2" fill="none" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="21.5" cy="10.5" r="1.3" fill="#FFFFFF" />
    </svg>
  );
}

export function FacebookIcon({ className, size = 22 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#1877F2"
        d="M32 16C32 7.163 24.837 0 16 0S0 7.163 0 16c0 7.99 5.852 14.61 13.5 15.806V20.625H9.437V16H13.5v-3.525c0-4.01 2.39-6.225 6.043-6.225 1.75 0 3.582.313 3.582.313v3.937h-2.018c-1.989 0-2.607 1.234-2.607 2.5V16h4.437l-.71 4.625H18.5V31.806C26.148 30.61 32 23.989 32 16Z"
      />
      <path
        fill="#FFFFFF"
        d="m22.227 20.625.71-4.625H18.5v-3c0-1.266.618-2.5 2.607-2.5h2.018V6.563s-1.832-.313-3.582-.313c-3.654 0-6.043 2.215-6.043 6.225V16H9.437v4.625H13.5V31.806a16.13 16.13 0 0 0 5 0V20.625h3.727Z"
      />
    </svg>
  );
}

export function LinkIcon({ className, size = 22 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.08" />
      <path
        d="M13.5 18.5 18.5 13.5M14 11h-2a4 4 0 1 0 0 8h2M18 21h2a4 4 0 1 0 0-8h-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ---- Stubs adicionais para a landing web (texto puro, sem ícones) ----
function TextBadge({ label, className, size = 22 }: IconProps & { label: string }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: size,
        padding: "0 6px",
        fontSize: Math.max(9, Math.round(size * 0.45)),
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        borderRadius: 4,
        border: "1px solid currentColor",
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}

export function YouTubeIcon(p: IconProps) { return <TextBadge {...p} label="YT" />; }
export function TikTokIcon(p: IconProps) { return <TextBadge {...p} label="TT" />; }
export function HotmartIcon(p: IconProps) { return <TextBadge {...p} label="Hot" />; }
export function KiwifyIcon(p: IconProps) { return <TextBadge {...p} label="Kw" />; }
export function TeachableIcon(p: IconProps) { return <TextBadge {...p} label="Tc" />; }
export function SpotifyIcon(p: IconProps) { return <TextBadge {...p} label="Sp" />; }
