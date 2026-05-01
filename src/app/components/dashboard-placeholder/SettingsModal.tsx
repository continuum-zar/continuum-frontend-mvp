"use client";

import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BookOpen, ChevronRight, LogOut, X } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { getApiErrorMessage, sendWaitlistInviteEmail, updateCurrentUserProfile } from "@/api";
import { useProjects } from "@/api/hooks";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceTourStore } from "@/store/workspaceTourStore";
import { memberAvatarBackgroundFromKey } from "@/lib/memberAvatar";
import { workspaceJoin } from "@/lib/workspacePaths";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { DiscordIntegrationModal } from "./DiscordIntegrationModal";
import { FeedbackModal } from "./FeedbackModal";
import { GithubIntegrationModal } from "./GithubIntegrationModal";
import { DiscordTriggersSection } from "./settings/DiscordTriggersSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const BRAND_LOGO = {
  github: "/assets/brand-assets/github-logo.svg",
  cursor: "/assets/brand-assets/cursor-logo.svg",
  discord: "/assets/brand-assets/discord-logo.svg",
} as const;

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
  /** One-shot resume after GitHub OAuth: open nested GitHub integration with optional project id. */
  postGithubOAuthGithubModal?: { projectApiId: number | null } | null;
  onPostGithubOAuthGithubModalConsumed?: () => void;
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


export function SettingsModal({
  open,
  onOpenChange,
  tourSection,
  postGithubOAuthGithubModal = null,
  onPostGithubOAuthGithubModalConsumed,
}: SettingsModalProps) {
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
  const [invoiceCurrency, setInvoiceCurrency] = useState<(typeof INVOICE_CURRENCIES)[number]>("ZAR");
  const [invoiceHourlyRate, setInvoiceHourlyRate] = useState("200");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankSwiftBic, setBankSwiftBic] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [githubIntegrationOpen, setGithubIntegrationOpen] = useState(false);
  const [githubModalOauthResumeProjectApiId, setGithubModalOauthResumeProjectApiId] = useState<number | null>(null);
  const [discordWebhookOpen, setDiscordWebhookOpen] = useState(false);
  const [discordProjectId, setDiscordProjectId] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSendPending, setWaitlistSendPending] = useState(false);

  const projectsQuery = useProjects({ enabled: open });
  const projects = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data],
  );

  useEffect(() => {
    if (!open) return;
    if (projects.length === 0) {
      setDiscordProjectId(null);
      return;
    }
    setDiscordProjectId((prev) => {
      if (prev != null && projects.some((p) => p.apiId === prev)) return prev;
      return projects[0]?.apiId ?? null;
    });
  }, [open, projects]);

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
    setWaitlistEmail("");
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setGitCommitEmail(user.git_commit_email?.trim() ?? "");
      const cur = (user.invoice_currency ?? "ZAR").toUpperCase();
      setInvoiceCurrency(
        (INVOICE_CURRENCIES as readonly string[]).includes(cur)
          ? (cur as (typeof INVOICE_CURRENCIES)[number])
          : "ZAR",
      );
      const rawRate = user.hourly_rate;
      const rateStr =
        rawRate !== undefined && rawRate !== null && String(rawRate).trim() !== ""
          ? String(rawRate)
          : "200";
      setInvoiceHourlyRate(rateStr);
      setBankAccountName(user.bank_account_name?.trim() ?? "");
      setBankAccountNumber(user.bank_account_number?.trim() ?? "");
      setBankName(user.bank_name?.trim() ?? "");
      setBankIban(user.bank_iban?.trim() ?? "");
      setBankSwiftBic(user.bank_swift_bic?.trim() ?? "");
    } else {
      setFirstName("");
      setLastName("");
      setGitCommitEmail("");
      setInvoiceCurrency("ZAR");
      setInvoiceHourlyRate("200");
      setBankAccountName("");
      setBankAccountNumber("");
      setBankName("");
      setBankIban("");
      setBankSwiftBic("");
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

  useEffect(() => {
    if (!open || postGithubOAuthGithubModal == null) return;
    setGithubModalOauthResumeProjectApiId(postGithubOAuthGithubModal.projectApiId);
    setGithubIntegrationOpen(true);
    onPostGithubOAuthGithubModalConsumed?.();
  }, [open, postGithubOAuthGithubModal, onPostGithubOAuthGithubModalConsumed]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSection("general");
      setFeedbackOpen(false);
      setGithubIntegrationOpen(false);
      setGithubModalOauthResumeProjectApiId(null);
      setDiscordWebhookOpen(false);
    }
    onOpenChange(next);
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
    if (section === "invoice") {
      const rateNum = parseFloat(invoiceHourlyRate.replace(",", "."));
      if (!Number.isFinite(rateNum) || rateNum < 0) {
        toast.error("Enter a valid default hourly rate");
        return;
      }
      setSavePending(true);
      try {
        await updateCurrentUserProfile({
          hourly_rate: rateNum,
          invoice_currency: invoiceCurrency,
          bank_account_name: bankAccountName.trim() ? bankAccountName.trim() : null,
          bank_account_number: bankAccountNumber.trim() ? bankAccountNumber.trim() : null,
          bank_name: bankName.trim() ? bankName.trim() : null,
          bank_iban: bankIban.trim() ? bankIban.trim() : null,
          bank_swift_bic: bankSwiftBic.trim() ? bankSwiftBic.trim() : null,
        });
        await checkAuth(true);
        toast.success("Settings saved");
        handleOpenChange(false);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not save invoice settings"));
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
    section === "general" || section === "invoice";

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
                  <div className="flex flex-col gap-2">
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
                          Discord
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col divide-y divide-[#ebedee]">
                      <DiscordTriggersSection
                        projectId={discordProjectId}
                        renderAsNotificationRows
                        onSetupWebhook={() => {
                          setSection("integrations");
                          setDiscordWebhookOpen(true);
                        }}
                      />
                    </div>
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
                    <p className="font-['Satoshi',sans-serif] text-[13px] leading-normal text-[#727d83]">
                      Used as the default rate when generating invoices unless you override it per invoice.
                    </p>
                  </div>

                  <div className="border-t border-[#ebedee] pt-2">
                    <p className="mb-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                      Bank details
                    </p>
                    <p className="mb-4 font-['Satoshi',sans-serif] text-[13px] leading-normal text-[#727d83]">
                      Shown on PDF invoices so clients can pay you. All fields are optional.
                    </p>
                    <div className="flex flex-col gap-4">
                      <label className="flex flex-col gap-2">
                        <span className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
                          Account name (as on bank account)
                        </span>
                        <input
                          type="text"
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          autoComplete="name"
                          className="h-10 w-full rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
                          Bank name
                        </span>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="h-10 w-full rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
                          Account number
                        </span>
                        <input
                          type="text"
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          autoComplete="off"
                          className="h-10 w-full rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
                          IBAN
                        </span>
                        <input
                          type="text"
                          value={bankIban}
                          onChange={(e) => setBankIban(e.target.value.replace(/\s+/g, " "))}
                          autoComplete="off"
                          className="h-10 w-full rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
                          SWIFT / BIC
                        </span>
                        <input
                          type="text"
                          value={bankSwiftBic}
                          onChange={(e) => setBankSwiftBic(e.target.value.replace(/\s+/g, "").toUpperCase())}
                          autoComplete="off"
                          className="h-10 w-full rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {section === "integrations" && (
                <div className="flex flex-col gap-4 pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <img
                        src={BRAND_LOGO.github}
                        alt=""
                        aria-hidden
                        className="mt-0.5 size-6 shrink-0"
                      />
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                          GitHub
                        </p>
                        <p className="font-['Satoshi',sans-serif] text-[14px] font-normal text-[#606d76]">
                          Connect the GitHub App to a project to authorize access and list repositories from your
                          installation.
                        </p>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setGithubIntegrationOpen(true)}
                          className={cn(outlineActionClass, "gap-1")}
                        >
                          Manage
                          <ChevronRight className="size-5 shrink-0 text-[#0b191f]" strokeWidth={1.5} aria-hidden />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Manage GitHub integration</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-t border-[#ebedee] pt-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <img
                        src={BRAND_LOGO.discord}
                        alt=""
                        aria-hidden
                        className="mt-0.5 size-6 shrink-0"
                      />
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                          Discord
                        </p>
                        <p className="font-['Satoshi',sans-serif] text-[14px] font-normal text-[#606d76]">
                          Link a Discord webhook to a project to send task and milestone updates to a channel. Pick
                          which events fire under Notifications.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDiscordWebhookOpen(true)}
                      disabled={discordProjectId == null}
                      className={cn(
                        outlineActionClass,
                        "gap-1 disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      title={
                        discordProjectId == null
                          ? "No project available to link"
                          : undefined
                      }
                    >
                      Manage
                      <ChevronRight className="size-5 shrink-0 text-[#0b191f]" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-t border-[#ebedee] pt-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <img
                        src={BRAND_LOGO.cursor}
                        alt=""
                        aria-hidden
                        className="mt-0.5 size-6 shrink-0"
                      />
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                          Cursor MCP
                        </p>
                        <p className="font-['Satoshi',sans-serif] text-[14px] font-normal text-[#606d76]">
                          Connect Cursor to Continuum so your AI agent can pull tasks, update checklists, and change statuses.
                        </p>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      <TooltipContent>Open Cursor MCP setup</TooltipContent>
                    </Tooltip>
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
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      <TooltipContent>Report an issue</TooltipContent>
                    </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleOpenChange(false)}
                      className="h-10 rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Cancel
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Discard changes</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={savePending}
                      className="h-10 rounded-[8px] bg-[#0b191f] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#fcfbf8] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savePending ? "Saving…" : "Save"}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Save settings changes</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
    <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    <GithubIntegrationModal
      open={githubIntegrationOpen}
      onOpenChange={(next) => {
        setGithubIntegrationOpen(next);
        if (!next) setGithubModalOauthResumeProjectApiId(null);
      }}
      oauthResumeProjectApiId={githubIntegrationOpen ? githubModalOauthResumeProjectApiId : null}
      onOAuthResumeProjectApplied={() => setGithubModalOauthResumeProjectApiId(null)}
    />
    <DiscordIntegrationModal
      open={discordWebhookOpen}
      onOpenChange={setDiscordWebhookOpen}
      projectId={discordProjectId}
      onProjectIdChange={setDiscordProjectId}
    />
    </>
  );
}
