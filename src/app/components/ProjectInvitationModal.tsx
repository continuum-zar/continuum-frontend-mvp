import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { useAcceptInvitation, useDeclineInvitation, getApiErrorMessage } from '@/api/hooks';
import { projectKeys, normalizeProjectKeyId } from '@/api/projects';
import type { ProjectInvitation, ProjectInvitationByToken } from '@/types/invitation';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { SESSION_INVITE_TOKEN_KEY } from '@/app/components/welcome/welcomeModalAssets';
import { resolveProjectBoardPath } from '@/lib/defaultBoardPath';

function formatRole(role: string): string {
  const r = (role || '').toLowerCase();
  if (r === 'project_manager') return 'Project Manager';
  if (r === 'developer') return 'Developer';
  if (r === 'client') return 'Client';
  return role;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: (ProjectInvitation | ProjectInvitationByToken) | null;
  /** When true, user cannot dismiss by clicking outside or Escape (must Accept or Decline). */
  forceChoice?: boolean;
};

export function ProjectInvitationModal({ open, onOpenChange, invitation, forceChoice }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();

  const handleAccept = () => {
    if (!invitation) return;
    acceptMutation.mutate(invitation.id, {
      onSuccess: async () => {
        try {
          sessionStorage.removeItem(SESSION_INVITE_TOKEN_KEY);
        } catch {
          /* ignore */
        }
        const pid = normalizeProjectKeyId(invitation.project_id);
        void queryClient.invalidateQueries({ queryKey: projectKeys.members(pid) });
        void queryClient.invalidateQueries({ queryKey: projectKeys.detail(pid) });
        toast.success('You joined the project');
        onOpenChange(false);
        const path = await resolveProjectBoardPath(invitation.project_id);
        navigate(path);
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Could not accept invitation'));
      },
    });
  };

  const handleDecline = () => {
    if (!invitation) return;
    declineMutation.mutate(invitation.id, {
      onSuccess: () => {
        try {
          sessionStorage.removeItem(SESSION_INVITE_TOKEN_KEY);
        } catch {
          /* ignore */
        }
        toast.message('Invitation declined');
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, 'Could not decline invitation'));
      },
    });
  };

  const busy = acceptMutation.isPending || declineMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        hideClose={forceChoice}
        onInteractOutside={(e) => {
          if (forceChoice) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (forceChoice) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Project invitation</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 pt-2 text-left text-sm text-muted-foreground">
              {invitation ? (
                <>
                  <p>
                    <span className="font-medium text-foreground">{invitation.inviter_name ?? 'Someone'}</span>{' '}
                    invited you to join{' '}
                    <span className="font-medium text-foreground">{invitation.project_name}</span> as{' '}
                    <span className="font-medium text-foreground">{formatRole(invitation.role)}</span>.
                  </p>
                  <p className="text-xs">Email: {invitation.email}</p>
                </>
              ) : (
                <p>Loading invitation…</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-3">
          <Button type="button" variant="outline" onClick={handleDecline} disabled={busy || !invitation}>
            {declineMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline'}
          </Button>
          <Button type="button" onClick={handleAccept} disabled={busy || !invitation}>
            {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
