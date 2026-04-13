import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useAcceptInvitation, useDeclineInvitation, getApiErrorMessage } from '@/api/hooks';
import { projectKeys, normalizeProjectKeyId } from '@/api/projects';
import type { ProjectInvitation, ProjectInvitationByToken } from '@/types/invitation';
import { SESSION_INVITE_TOKEN_KEY } from '@/app/components/welcome/welcomeModalAssets';
import { resolveProjectBoardPath } from '@/lib/defaultBoardPath';

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from '@/app/components/ui/dialog';
import { cn } from '@/app/components/ui/utils';

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
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onInteractOutside={(e) => {
            if (forceChoice) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (forceChoice) e.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white font-['Satoshi',sans-serif] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Project invitation</DialogPrimitive.Title>

          <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            {forceChoice ? (
              <div className="size-5" aria-hidden />
            ) : (
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center text-[#606d76]"
                  aria-label="Close"
                >
                  <ArrowLeft className="size-5" />
                </button>
              </DialogClose>
            )}
            <p className="text-center text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
              Project invitation
            </p>
            <div className="size-5" aria-hidden />
          </div>

          <div
            className="px-9 py-6"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)',
            }}
          >
            <div className="space-y-3 text-left text-[15px] leading-relaxed text-[#606d76]">
              {invitation ? (
                <>
                  <p>
                    <span className="font-semibold text-[#0b191f]">{invitation.inviter_name ?? 'Someone'}</span>{' '}
                    invited you to join{' '}
                    <span className="font-semibold text-[#0b191f]">{invitation.project_name}</span> as{' '}
                    <span className="font-semibold text-[#0b191f]">{formatRole(invitation.role)}</span>.
                  </p>
                  <p className="text-[14px] text-[#727d83]">
                    Email: <span className="text-[#0b191f]">{invitation.email}</span>
                  </p>
                </>
              ) : (
                <p className="text-[#606d76]">Loading invitation…</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#e5e7eb] bg-[#f9f9f9] px-9 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleDecline}
              disabled={busy || !invitation}
              className={cn(
                'inline-flex h-10 min-w-[100px] items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-white px-5 text-[14px] font-semibold text-[#252014] transition-colors',
                busy || !invitation
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-[#f5f7f8]',
              )}
            >
              {declineMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline'}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={busy || !invitation}
              style={
                invitation && !busy
                  ? {
                      background:
                        'linear-gradient(141.68deg, #24B5F8 -123.02%, #5521FE 802.55%)',
                    }
                  : undefined
              }
              className={cn(
                'inline-flex h-10 min-w-[100px] items-center justify-center rounded-[8px] px-5 text-[14px] font-semibold transition-[filter,opacity] duration-200',
                invitation && !busy
                  ? 'text-white hover:brightness-105'
                  : 'cursor-not-allowed bg-[rgba(96,109,118,0.1)] text-[#606d76]/50',
              )}
            >
              {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept'}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
