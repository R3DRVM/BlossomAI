import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

export function LogoPreview() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Logo size={48} />
        <div>
          <h3 className="font-semibold">Current Theme: {theme}</h3>
          <p className="text-sm text-muted-foreground">
            Logo automatically switches between light (pink) and dark (white) modes
          </p>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          variant={theme === "light" ? "default" : "outline"}
          onClick={() => setTheme("light")}
        >
          Light Mode
        </Button>
        <Button 
          variant={theme === "dark" ? "default" : "outline"}
          onClick={() => setTheme("dark")}
        >
          Dark Mode
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>• Light Mode: Pink filled cherry blossom logo</p>
        <p>• Dark Mode: White glowing cherry blossom logo</p>
      </div>
    </div>
  );
}
