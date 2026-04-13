import { ProjectInvitationModal } from '@/app/components/ProjectInvitationModal';
import { usePendingInvitations } from '@/api/hooks';

/**
 * Shows the first pending project invitation for the signed-in user (any protected area).
 */
export function PendingInvitationsHost() {
  const { data: pending } = usePendingInvitations();
  const first = pending?.[0] ?? null;

  return (
    <ProjectInvitationModal
      open={Boolean(first)}
      onOpenChange={() => {
        /* require Accept / Decline — closing is disabled via modal props */
      }}
      invitation={first}
      forceChoice
    />
  );
}
