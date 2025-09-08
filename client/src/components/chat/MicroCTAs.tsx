import { Button } from "@/components/ui/button";
import { MicroCTA } from "@/ai/conversation/response-composer";
import { setLatestPlan } from "@/bridge/planBridge";
import { applyPlanAsSnapshot } from "@/bridge/portfolioStore";
import { alertsStore } from "@/bridge/alertsStore";
import { planMemory } from "@/ai/conversation/plan-memory";

interface MicroCTAsProps {
  ctas: MicroCTA[];
  onAction?: (action: string, data?: any) => void;
}

export function MicroCTAs({ ctas, onAction }: MicroCTAsProps) {
  if (!ctas || ctas.length === 0) {
    return null;
  }

  const handleAction = async (cta: MicroCTA) => {
    try {
      switch (cta.action) {
        case 'simulate':
          // Navigate to Strategy Builder (this would be handled by parent)
          onAction?.('navigate', { tab: 'terminal' });
          break;
          
        case 'apply':
          // Apply current plan to portfolio
          const currentPlan = planMemory.getCurrentPlan();
          if (currentPlan) {
            try {
              await applyPlanAsSnapshot(currentPlan);
              onAction?.('toast', { 
                title: "Applied to Portfolio", 
                description: `Strategy applied with ${currentPlan.allocations.length} positions.` 
              });
            } catch (error) {
              onAction?.('toast', { 
                title: "Application Failed", 
                description: error instanceof Error ? error.message : "Insufficient funds or error occurred.",
                variant: "destructive"
              });
            }
          }
          break;
          
        case 'analytics':
          // Navigate to Analytics
          onAction?.('navigate', { tab: 'analytics' });
          break;
          
        case 'alert':
          // Create alert from current context
          const alertRule = {
            type: 'apy_threshold' as const,
            asset: 'USDC',
            chain: 'solana',
            condition: 'APR changes by 10%',
            frequency: '15 minutes'
          };
          alertsStore.createAlert(alertRule);
          onAction?.('toast', { 
            title: "Alert Created", 
            description: "Monitoring active for your positions." 
          });
          break;
          
        case 'portfolio':
          // Navigate to Portfolio
          onAction?.('navigate', { tab: 'portfolio' });
          break;
          
        case 'undo':
          // Undo last modification
          const undonePlan = planMemory.undoLastModification();
          if (undonePlan) {
            setLatestPlan(undonePlan);
            onAction?.('toast', { 
              title: "Changes Undone", 
              description: "Reverted to previous plan." 
            });
          }
          break;
          
        case 'deploy':
          // Start deployment flow
          onAction?.('deploy', cta.data);
          break;
          
        case 'find':
          // Start yield search
          onAction?.('find', cta.data);
          break;
          
        case 'compare':
          // Start comparison
          onAction?.('compare', cta.data);
          break;
          
        case 'execute':
          // Execute the plan
          onAction?.('execute', cta.data);
          break;
          
        case 'adjust':
          // Adjust the plan
          onAction?.('adjust', cta.data);
          break;
          
        case 'cancel':
          // Cancel the plan
          onAction?.('cancel', cta.data);
          break;
      }
    } catch (error) {
      console.error('CTA action failed:', error);
      onAction?.('toast', { 
        title: "Action Failed", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {ctas.map((cta, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => handleAction(cta)}
          className="text-xs bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 hover:border-pink-300"
        >
          {cta.label}
        </Button>
      ))}
    </div>
  );
}
