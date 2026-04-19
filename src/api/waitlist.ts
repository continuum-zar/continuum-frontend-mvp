import api from "@/lib/api";

/** POST /admin/waitlist/send-invite — global admin only. */
export async function sendWaitlistInviteEmail(email: string): Promise<void> {
  await api.post("/admin/waitlist/send-invite", { email });
}
