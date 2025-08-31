import { useTheme } from "@/components/ui/theme-provider";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  const { theme } = useTheme();
  
  // Import logos dynamically based on theme
  const logoSrc = theme === "dark" 
    ? "/src/assets/logos/blossom-dark.svg"
    : "/src/assets/logos/blossom-light.svg";

  return (
    <img 
      src={logoSrc}
      alt="BlossomAI Logo"
      width={size}
      height={size}
      className={className}
    />
  );
}
