import { useState } from 'react';
import { MoreVertical, RotateCcw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getActiveUserId } from '@/ai/userUtils';
import { reset } from '@/bridge/paperCustody';
import { clearPositions } from '@/bridge/positionsStore';
import { useToast } from '@/hooks/use-toast';

interface ChatHeaderMenuProps {
  onResetChat: () => void;
}

export function ChatHeaderMenu({ onResetChat }: ChatHeaderMenuProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showResetWalletDialog, setShowResetWalletDialog] = useState(false);
  const currentUserId = getActiveUserId();
  const { toast } = useToast();

  const handleResetConfirm = () => {
    onResetChat();
    setShowResetDialog(false);
  };

  const handleResetWalletConfirm = () => {
    const userId = getActiveUserId() || 'guest';
    
    if (import.meta.env.VITE_DEBUG_CHAT === '1') {
      console.log('[wallet:reset]', userId, 'Clearing wallet and positions');
    }
    
    reset(userId);
    clearPositions(userId);
    
    toast({
      title: "Wallet Reset Complete",
      description: "Your balances and positions have been reset to the original seed amounts.",
    });
    setShowResetWalletDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset chat for this user...
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowResetWalletDialog(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            Reset wallet & positions for this user...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Chat</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the conversation for user "{currentUserId}". Other users' chats will remain unchanged. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm}>
              Reset Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetWalletDialog} onOpenChange={setShowResetWalletDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Demo Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              This will completely reset the demo wallet for user "{currentUserId}" to the original seed amounts. 
              All positions will be cleared and your available cash will be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetWalletConfirm}>
              Reset Wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
