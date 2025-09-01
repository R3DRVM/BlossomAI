import { useState } from 'react';
import { MoreVertical, RotateCcw } from 'lucide-react';
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

interface ChatHeaderMenuProps {
  onResetChat: () => void;
}

export function ChatHeaderMenu({ onResetChat }: ChatHeaderMenuProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const currentUserId = getActiveUserId();

  const handleResetConfirm = () => {
    onResetChat();
    setShowResetDialog(false);
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
    </>
  );
}
