"use client";

import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BookOpen, Check, ChevronRight, LogOut, X } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { getApiErrorMessage, sendWaitlistInviteEmail, updateCurrentUserProfile } from "@/api";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceTourStore } from "@/store/workspaceTourStore";
import { memberAvatarBackgroundFromKey } from "@/lib/memberAvatar";
import { workspaceJoin } from "@/lib/workspacePaths";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { FeedbackModal } from "./FeedbackModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";

const INVOICE_CURRENCIES = ["ZAR", "USD", "EUR", "GBP"] as const;

const CURRENCY_SYMBOL: Record<(typeof INVOICE_CURRENCIES)[number], string> = {
  ZAR: "R",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const SUPPORT_EMAIL = "support@continuum.co.za";

/** Opens Gmail compose in a new tab with To pre-filled. */
const GMAIL_COMPOSE_HREF = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}`;

const outlineActionClass =
  "inline-flex h-10 shrink-0 items-center rounded-[8px] border border-[#ebedee] bg-white px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none ring-offset-2 transition-colors hover:bg-[#f9f9f9] focus-visible:ring-2 focus-visible:ring-ring";

/** Same look as outline chevron actions; no navigation until wired up. */
const placeholderActionClass =
  "inline-flex h-10 shrink-0 cursor-default items-center gap-1 rounded-[8px] border border-[#ebedee] bg-white py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring";

const placeholderLinkClass =
  "cursor-default border-0 bg-transparent p-0 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] underline decoration-solid underline-offset-2 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring";

export type SettingsSection =
  | "general"
  | "notification"
  | "invoice"
  | "integrations"
  | "support"
  | "waitlist";

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set while the dialog is open, switches the visible section (guided tour). */
  tourSection?: SettingsSection | null;
};

const NAV: { id: SettingsSection; label: string }[] = [
  { id: "general", label: "General" },
  { id: "notification", label: "Notifications" },
  { id: "invoice", label: "Invoice" },
  { id: "integrations", label: "Integrations" },
  { id: "support", label: "Support & legal" },
];

const SECTION_TITLE: Record<SettingsSection, string> = {
  general: "General",
  notification: "Notifications",
  invoice: "Invoice",
  integrations: "Integrations",
  support: "Support & legal",
  waitlist: "Waitlist",
};

type NotificationPrefs = { digest: boolean; instant: boolean };

const NOTIFICATION_DEFAULTS: Record<string, NotificationPrefs> = {
  mention: { digest: true, instant: false },
  assigned: { digest: true, instant: true },
  taskFollow: { digest: false, instant: false },
  sprint: { digest: false, instant: true },
  due24h: { digest: false, instant: true },
  timeLog: { digest: false, instant: true },
};

const NOTIFICATION_ROWS: { id: keyof typeof NOTIFICATION_DEFAULTS; label: string }[] = [
  { id: "mention", label: "I am mentioned (@) in a comment" },
  { id: "assigned", label: "I am assigned to a task" },
  { id: "taskFollow", label: "An update occurs on a task I follow/watch" },
  { id: "sprint", label: "A Sprint begins or ends" },
  { id: "due24h", label: "Reminder: Task due in 24 hours" },
  { id: "timeLog", label: "Reminder: I haven't logged time today" },
];

function NotificationCheckbox({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[4px] outline-none ring-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        checked
          ? "text-white"
          : "border border-[#ebedee] bg-[#f9f9f9]",
      )}
      style={
        checked
          ? {
              backgroundImage:
                "linear-gradient(141.68deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(85, 33, 254) 0%, rgb(85, 33, 254) 100%)",
            }
          : undefined
      }
    >
      {checked ? <Check className="size-[13px]" strokeWidth={2.5} aria-hidden /> : null}
    </button>
  );
}

function defaultNotificationPrefs(): Record<keyof typeof NOTIFICATION_DEFAULTS, NotificationPrefs> {
  return {
    mention: { ...NOTIFICATION_DEFAULTS.mention },
    assigned: { ...NOTIFICATION_DEFAULTS.assigned },
    taskFollow: { ...NOTIFICATION_DEFAULTS.taskFollow },
    sprint: { ...NOTIFICATION_DEFAULTS.sprint },
    due24h: { ...NOTIFICATION_DEFAULTS.due24h },
    timeLog: { ...NOTIFICATION_DEFAULTS.timeLog },
  };
}

export function SettingsModal({ open, onOpenChange, tourSection }: SettingsModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const authLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const startWorkspaceTour = useWorkspaceTourStore((s) => s.startTour);
  const [section, setSection] = useState<SettingsSection>("general");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gitCommitEmail, setGitCommitEmail] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState(defaultNotificationPrefs);
  const [invoiceCurrency, setInvoiceCurrency] = useState<(typeof INVOICE_CURRENCIES)[number]>("ZAR");
  const [invoiceHourlyRate, setInvoiceHourlyRate] = useState("200");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSendPending, setWaitlistSendPending] = useState(false);

  const isGlobalAdmin = user?.role?.toLowerCase() === "admin";

  const settingsNavItems = useMemo(() => {
    const items = [...NAV];
    if (isGlobalAdmin) {
      items.push({ id: "waitlist", label: "Waitlist" });
    }
    return items;
  }, [isGlobalAdmin]);

  useEffect(() => {
    if (!open) return;
    setNotificationPrefs(defaultNotificationPrefs());
    setInvoiceCurrency("ZAR");
    setInvoiceHourlyRate("200");
    setWaitlistEmail("");
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setGitCommitEmail(user.git_commit_email?.trim() ?? "");
    } else {
      setFirstName("");
      setLastName("");
      setGitCommitEmail("");
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    if (tourSection === "waitlist" && !isGlobalAdmin) {
      setSection("general");
      return;
    }
    setSection(tourSection ?? "general");
  }, [open, tourSection, isGlobalAdmin]);

  useEffect(() => {
    if (section === "waitlist" && !isGlobalAdmin) {
      setSection("general");
    }
  }, [section, isGlobalAdmin]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSection("general");
      setFeedbackOpen(false);
    }
    onOpenChange(next);
  };

  const setNotificationPref = (
    rowId: keyof typeof NOTIFICATION_DEFAULTS,
    key: keyof NotificationPrefs,
    value: boolean,
  ) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], [key]: value },
    }));
  };

  const profileInitials =
    user != null
      ? user.first_name && user.last_name
        ? `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()
        : user.email
          ? user.email.slice(0, 2).toUpperCase()
          : "?"
      : "?";
  const avatarBg = user ? memberAvatarBackgroundFromKey(user.id || user.email) : "#e19c02";
  const showAdminReleaseNotesLink = isGlobalAdmin;

  const handleSave = async () => {
    if (section === "general") {
      setSavePending(true);
      try {
        await updateCurrentUserProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          git_commit_email: gitCommitEmail.trim() ? gitCommitEmail.trim() : null,
        });
        await checkAuth(true);
        toast.success("Settings saved");
        handleOpenChange(false);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not save settings"));
      } finally {
        setSavePending(false);
      }
      return;
    }
    toast.success("Settings saved");
    handleOpenChange(false);
  };

  const handleLogout = async () => {
    handleOpenChange(false);
    await logout();
    navigate("/login");
  };

  const handleReplayTutorial = () => {
    handleOpenChange(false);
    window.setTimeout(() => {
      startWorkspaceTour(0);
    }, 0);
  };

  const handleWaitlistSend = async () => {
    const trimmed = waitlistEmail.trim();
    if (!trimmed) {
      toast.error("Enter an email address");
      return;
    }
    setWaitlistSendPending(true);
    try {
      await sendWaitlistInviteEmail(trimmed);
      toast.success("Invite email sent");
      setWaitlistEmail("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not send invite email"));
    } finally {
      setWaitlistSendPending(false);
    }
  };

  const showSaveFooter =
    section === "general" || section === "notification" || section === "invoice";

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex h-[575px] w-[900px] max-w-[calc(100%-2rem)] shrink-0 flex-row items-start overflow-hidden rounded-[16px] border border-[#ebedee] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "-translate-x-1/2 -translate-y-1/2",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Settings</DialogPrimitive.Title>

          <aside className="flex h-full min-h-0 w-[240px] shrink-0 flex-col gap-6 border-r border-[#ebedee] bg-[#edf0f3] px-4 py-6">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-6 shrink-0 items-center justify-center rounded text-[#0b191f] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close settings"
              >
                <X className="size-6" strokeWidth={1.5} />
              </button>
            </DialogClose>
            <nav
              className="flex min-h-0 flex-1 flex-col gap-0"
              aria-label="Settings sections"
            >
              {settingsNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-tour={`settings-nav-${item.id}`}
                  onClick={() => setSection(item.id)}
                  className={cn(
                    "flex h-10 w-full items-center rounded-[8px] px-4 py-2 text-left font-['Satoshi',sans-serif] text-[16px] font-medium transition-colors",
                    section === item.id
                      ? "border border-[#ededed] bg-white text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                      : "text-[#606d76] hover:bg-[rgba(255,255,255,0.6)]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                data-tour="settings-replay-tutorial"
                onClick={handleReplayTutorial}
                className="flex h-10 w-full items-center gap-2 rounded-[8px] px-4 text-left font-['Satoshi',sans-serif] text-[16px] font-medium text-[#606d76] outline-none transition-colors hover:bg-[rgba(255,255,255,0.6)] focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BookOpen className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                Tutorial
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={authLoading}
                className="flex h-10 w-full items-center gap-2 rounded-[8px] px-4 text-left font-['Satoshi',sans-serif] text-[16px] font-medium text-[#606d76] outline-none transition-colors hover:bg-[rgba(255,255,255,0.6)] focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                <LogOut className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
                {authLoading ? "Logging out…" : "Log out"}
              </button>
            </div>
          </aside>

          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="border-b border-[#ebedee] pb-4">
                <h2 className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">
                  {SECTION_TITLE[section]}
                </h2>
              </div>

              {section === "general" && (
                <div className="flex flex-col gap-6 pt-6">
                  <div
                    className="flex size-[96px] shrink-0 items-center justify-center rounded-[3996px] border-4 border-white"
                    style={{ backgroundColor: avatarBg }}
                  >
                    <span className="font-['Satoshi',sans-serif] text-[36px] font-medium leading-[0.4] text-white">
                      {profileInitials}
                    </span>
                  </div>

                  <label className="flex flex-col gap-3">
                    <span className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                      First name
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      autoComplete="given-name"
                    />
                  </label>

                  <label className="flex flex-col gap-3">
                    <span className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                      Surname
                    </span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      autoComplete="family-name"
                    />
                  </label>

                  <label className="flex flex-col gap-3">
                    <span className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                      Git commit email
                    </span>
                    <input
                      type="email"
                      value={gitCommitEmail}
                      onChange={(e) => setGitCommitEmail(e.target.value)}
                      placeholder="Same as Git author if different from login"
                      autoComplete="email"
                      className="h-10 w-full rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <p className="font-['Satoshi',sans-serif] text-[13px] leading-normal text-[#727d83]">
                      Used to attribute pushes when your Git config email differs from your Continuum account.
                    </p>
                  </label>

                  {showAdminReleaseNotesLink ? (
                    <div className="flex flex-col gap-2 border-t border-[#ebedee] pt-6">
                      <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                        Product updates
                      </p>
                      <button
                        type="button"
                        className={outlineActionClass}
                        onClick={() => {
                          handleOpenChange(false);
                          navigate(workspaceJoin("admin", "release-notes"));
                        }}
                      >
                        Manage release notes
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {section === "notification" && (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex w-full flex-col rounded-t-[8px] border-b border-[#ebedee] bg-[#f9f9f9] py-1.5 pl-4">
                    <div className="flex w-full items-center gap-6 pr-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                          Trigger Event
                        </p>
                      </div>
                      <p className="w-[120px] shrink-0 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                        Email Digest
                      </p>
                      <p className="w-[120px] shrink-0 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                        Instant Email
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col divide-y divide-[#ebedee]">
                    {NOTIFICATION_ROWS.map((row) => {
                      const prefs = notificationPrefs[row.id];
                      return (
                        <div
                          key={row.id}
                          className="flex w-full items-center gap-6 py-2 pl-4"
                        >
                          <p className="min-w-0 flex-1 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#131617]">
                            {row.label}
                          </p>
                          <div className="flex w-[120px] shrink-0 items-center">
                            <NotificationCheckbox
                              checked={prefs.digest}
                              onCheckedChange={(v) => setNotificationPref(row.id, "digest", v)}
                              ariaLabel={`${row.label}: Email digest`}
                            />
                          </div>
                          <div className="flex w-[120px] shrink-0 items-center">
                            <NotificationCheckbox
                              checked={prefs.instant}
                              onCheckedChange={(v) => setNotificationPref(row.id, "instant", v)}
                              ariaLabel={`${row.label}: Instant email`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {section === "invoice" && (
                <div className="flex flex-col gap-6 pt-6">
                  <div className="flex flex-col gap-3">
                    <span className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                      Currency
                    </span>
                    <Select
                      value={invoiceCurrency}
                      onValueChange={(v) => setInvoiceCurrency(v as (typeof INVOICE_CURRENCIES)[number])}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-10 w-full rounded-[8px] border border-[#ebedee] bg-white px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] shadow-none focus:ring-2 focus:ring-ring",
                          "[&_svg]:size-6 [&_svg]:opacity-100 [&_svg]:text-[#0b191f]",
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[200] font-['Satoshi',sans-serif]">
                        {INVOICE_CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-[16px] font-medium">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                      Default Hourly Rate
                    </span>
                    <div className="flex h-10 items-center gap-1 rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium focus-within:ring-2 focus-within:ring-ring">
                      <span className="shrink-0 text-[#9fa5a8]" aria-hidden>
                        {CURRENCY_SYMBOL[invoiceCurrency]}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={invoiceHourlyRate}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d.]/g, "");
                          setInvoiceHourlyRate(raw);
                        }}
                        className="min-w-0 flex-1 border-0 bg-transparent font-medium text-[#0b191f] outline-none"
                        aria-label="Default hourly rate"
                      />
                    </div>
                  </div>
                </div>
              )}

              {section === "integrations" && (
                <div className="flex flex-col gap-4 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                        Cursor MCP
                      </p>
                      <p className="font-['Satoshi',sans-serif] text-[14px] font-normal text-[#606d76]">
                        Connect Cursor to Continuum so your AI agent can pull tasks, update checklists, and change statuses.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenChange(false);
                        navigate("/mcp-setup");
                      }}
                      className={cn(outlineActionClass, "gap-1")}
                    >
                      Setup
                      <ChevronRight className="size-5 shrink-0 text-[#0b191f]" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                </div>
              )}

              {section === "waitlist" && isGlobalAdmin && (
                <div className="flex flex-col gap-6 pt-6">
                  <p className="font-['Satoshi',sans-serif] text-[14px] font-normal leading-normal text-[#606d76]">
                    Send the off-waitlist invite email. The recipient gets a message that their account is ready, with a
                    link to create an account at continuumapp.co.za.
                  </p>
                  <label className="flex flex-col gap-3">
                    <span className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">Email</span>
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="email"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        placeholder="name@company.com"
                        autoComplete="email"
                        className="h-10 min-w-0 flex-1 rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => void handleWaitlistSend()}
                        disabled={waitlistSendPending}
                        className="h-10 shrink-0 rounded-[8px] bg-[#0b191f] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#fcfbf8] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {waitlistSendPending ? "Sending…" : "Send"}
                      </button>
                    </div>
                  </label>
                </div>
              )}

              {section === "support" && (
                <div className="flex flex-col gap-4 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                        Contact support
                      </p>
                      <p className="font-['Satoshi',sans-serif] text-[14px] font-normal text-[#0b191f]">
                        {SUPPORT_EMAIL}
                      </p>
                    </div>
                    <a
                      href={GMAIL_COMPOSE_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={outlineActionClass}
                    >
                      Email support
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                      Status page
                    </p>
                    <button type="button" className={placeholderActionClass} aria-disabled="true">
                      System uptime
                      <ChevronRight className="size-6 shrink-0 text-[#0b191f]" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p
                      id="settings-support-report-heading"
                      className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]"
                    >
                      Report issue
                    </p>
                    <button
                      type="button"
                      data-tour="settings-report-issue"
                      onClick={() => setFeedbackOpen(true)}
                      className={cn(outlineActionClass, "gap-1")}
                      aria-labelledby="settings-support-report-heading"
                    >
                      Report
                      <ChevronRight className="size-6 shrink-0 text-[#0b191f]" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                      Legal
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
                      <button type="button" className={placeholderLinkClass} aria-disabled="true">
                        Privacy
                      </button>
                      <button type="button" className={placeholderLinkClass} aria-disabled="true">
                        Terms
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackOpen(true)}
                        aria-label="Report an issue from the Legal section"
                        className="cursor-pointer border-0 bg-transparent p-0 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] underline decoration-solid underline-offset-2 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Report issue
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showSaveFooter && (
              <div className="flex shrink-0 justify-end gap-2 border-t border-[#ebedee] px-6 py-6">
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="h-10 rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={savePending}
                  className="h-10 rounded-[8px] bg-[#0b191f] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#fcfbf8] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savePending ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
    <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
