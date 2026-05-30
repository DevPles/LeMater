import { Link } from "@tanstack/react-router";

interface UserAvatarProps {
  name?: string;
  week?: number;
  photoUrl?: string | null;
}

export function UserAvatar({ name = "Mamãe", photoUrl }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      to="/app/perfil"
      aria-label="Meu perfil"
      className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity overflow-hidden"
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </Link>
  );
}
