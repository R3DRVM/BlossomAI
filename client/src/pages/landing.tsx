import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, BarChart3, Shield, Zap, TrendingUp, Users, Globe } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Terminal Interface",
      description: "Multi-panel terminal inspired by institutional trading platforms with real-time data feeds."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI Strategy Assistant",
      description: "Natural language queries for yield optimization and risk analysis powered by conversational AI."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Risk Management",
      description: "Institutional-grade risk assessment with smart contract auditing and insurance protocols."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Yield Aggregation",
      description: "Access 100+ DeFi protocols with automated rebalancing and compound optimization."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Institutional Access",
      description: "KYC/AML compliance with institutional custody integration and regulatory reporting."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Cross-Chain Support",
      description: "Multi-chain deployment across Ethereum, Solana, and other major DeFi ecosystems."
    }
  ];

  const stats = [
    { label: "Total Value Locked", value: "$2.4B+", change: "+12.3%" },
    { label: "Active Strategies", value: "1,247", change: "+8.9%" },
    { label: "Average APY", value: "14.7%", change: "+2.1%" },
    { label: "Risk Score", value: "7.8/10", change: "+0.3%" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo size={48} className="flex-shrink-0" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                Blossom
              </span>
            </div>
            <Button onClick={() => setLocation('/terminal')} data-testid="button-login">
              Access Terminal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            Institutional DeFi Platform
          </Badge>
          <h1 className="text-5xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            The Institutional 
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              {" "}DeFi Terminal{" "}
            </span>
            for Professional Yield Aggregation
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Combining terminal-style data interfaces with conversational AI and visual strategy building 
            for institutional-grade DeFi yield optimization.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button 
              size="lg" 
              onClick={() => setLocation('/terminal')}
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                  <div className="text-xs text-green-600 font-medium">{stat.change}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Built for Institutional Excellence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools that combine the best of traditional finance terminals 
              with cutting-edge DeFi innovation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/10 to-chart-2/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Optimize Your DeFi Yields?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join institutional investors who trust Blossom for professional-grade 
            DeFi yield aggregation and risk management.
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation('/terminal')}
            data-testid="button-start-terminal"
          >
            Access Terminal Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-chart-2 rounded">
                <BarChart3 className="h-4 w-4 text-primary-foreground m-1" />
              </div>
              <span className="font-medium">Blossom</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Blossom. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
