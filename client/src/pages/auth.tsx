import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, ArrowRight, User, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [username, setUsername] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn(username, acknowledged);
      if (result.success) {
        // Redirect will be handled by the auth hook
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-2 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              BlossomAI
            </h1>
          </div>
          <h2 className="text-xl font-semibold">Institutional DeFi Terminal</h2>
          <p className="text-muted-foreground text-sm">
            Access professional-grade yield optimization and strategy building
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">
              Demo Access
            </CardTitle>
            <CardDescription className="text-center">
              Enter your username to access the BlossomAI terminal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acknowledged"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                />
                <Label htmlFor="acknowledged" className="text-sm">
                  I acknowledge this is a demo environment for demonstration purposes
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90"
                disabled={isLoading || !username.trim() || !acknowledged}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Access Terminal</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 text-center">
          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Institutional-grade security</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>Enterprise features</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-purple-500" />
            <span>Team collaboration</span>
          </div>
        </div>
      </div>
    </div>
  );
}
