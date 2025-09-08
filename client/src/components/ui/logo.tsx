import { useTheme } from "@/components/ui/theme-provider";
import blossomDark from "@/assets/logos/blossom-dark.svg";
import blossomLight from "@/assets/logos/blossom-light.svg";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 48 }: LogoProps) {
  const { theme } = useTheme();
  
  // Use pink logo for both dark and light modes
  const logoSrc = blossomLight;

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
