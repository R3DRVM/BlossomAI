import { useTheme } from "@/components/ui/theme-provider";
import blossomDark from "@/assets/logos/blossom-dark.svg";
import blossomLight from "@/assets/logos/blossom-light.svg";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  const { theme } = useTheme();
  
  // Use imported logos based on theme
  const logoSrc = theme === "dark" ? blossomDark : blossomLight;

  return (
    <img 
      src={logoSrc}
      alt="Blossom Logo"
      width={size}
      height={size}
      className={className}
    />
  );
}
