import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  GripVertical,
  Info,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { exportInvoicePreviewPdf, getApiErrorMessage } from "@/api";
import { useProjects, useClientDetail, useProject } from "@/api/hooks";
import { aggregateLoggedHoursByTaskForProject } from "@/api/loggedHours";
import { useAuthStore } from "@/store/authStore";
import {
  expandedProjectFromLocation,
  isApiProjectId,
} from "@/app/data/dashboardPlaceholderProjects";
import type { Project } from "@/types/project";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../ui/utils";
import { STALE_TIME_DATA_MS } from "@/lib/queryDefaults";
import { toast } from "sonner";

type InvoiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type LineRow = {
  id: string;
  description: string;
  qty: number;
  rate: number;
};

/** Hide native number spinners so decimals aren’t clipped in narrow cells (Chrome/Safari/Firefox). */
const noNumberSpinner =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const money = (value: number) =>
  `R${value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatInvoiceDefaultNumber(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `INV-${y}-${m}`;
}

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function InvoiceModal({ open, onOpenChange }: InvoiceModalProps) {
  const user = useAuthStore((s) => s.user);
  const defaultHourlyRate = useMemo(() => {
    const raw = user?.hourly_rate;
    if (raw === undefined || raw === null || raw === "") return 200;
    const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : 200;
  }, [user]);

  const mkRow = useCallback(
    (overrides?: Partial<LineRow>): LineRow => ({
      id: crypto.randomUUID(),
      description: "",
      qty: 0,
      rate: defaultHourlyRate,
      ...overrides,
    }),
    [defaultHourlyRate],
  );
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get("project");

  const { data: projects = [], isPending: projectsPending } = useProjects();
  const apiProjects = useMemo(
    () => projects.filter((p) => isApiProjectId(p.id)),
    [projects],
  );

  const [invoiceNumber, setInvoiceNumber] = useState(() => formatInvoiceDefaultNumber(new Date()));
  const [issuedOn, setIssuedOn] = useState(todayIsoDate);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineRow[]>(() => [
    { id: crypto.randomUUID(), description: "", qty: 0, rate: 200 },
  ]);
  const [exportPending, setExportPending] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const projectSearchInputRef = useRef<HTMLInputElement>(null);
  const issuedOnInputRef = useRef<HTMLInputElement>(null);

  const openIssuedOnPicker = useCallback(() => {
    const el = issuedOnInputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.click();
    }
  }, []);

  const expandedId = expandedProjectFromLocation(location.pathname, projectParam);

  const selectedProject = useMemo(
    () => apiProjects.find((p) => p.id === selectedProjectId) ?? null,
    [apiProjects, selectedProjectId],
  );

  /** List items now include client_id; detail fetch fills gap if list is stale or old API. */
  const projectDetailQuery = useProject(open && selectedProject ? selectedProject.apiId : null);

  const clientIdForBill =
    selectedProject?.clientId ?? projectDetailQuery.data?.clientId ?? null;

  const waitingForProjectDetail =
    Boolean(
      open &&
        selectedProject &&
        selectedProject.clientId == null &&
        (projectDetailQuery.isPending || projectDetailQuery.isFetching),
    );

  const { data: billClient, isLoading: billClientLoading } = useClientDetail(clientIdForBill);

  const fromName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "—"
    : "—";
  const fromEmail = user?.email ?? "—";

  const projectHoursQuery = useQuery({
    queryKey: ["invoice-modal-project-hours", selectedProject?.apiId],
    queryFn: () => aggregateLoggedHoursByTaskForProject(selectedProject!.apiId),
    enabled: Boolean(open && selectedProject),
    staleTime: STALE_TIME_DATA_MS,
    refetchOnWindowFocus: false,
  });

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return apiProjects;
    return apiProjects.filter((p) => p.title.toLowerCase().includes(q));
  }, [apiProjects, projectSearch]);

  /** Defaults when opening + route-based project preselect */
  useEffect(() => {
    if (!open) return;
    const now = new Date();
    setInvoiceNumber(formatInvoiceDefaultNumber(now));
    setIssuedOn(todayIsoDate());
    setProjectSearch("");
    const routeProject =
      expandedId && isApiProjectId(expandedId) ? expandedId : null;
    setSelectedProjectId(routeProject);
    setLineItems([mkRow()]);
  }, [open, expandedId, mkRow]);

  /** Clear lines when switching project so we don’t show the previous project’s tasks while loading. */
  useEffect(() => {
    if (!open || !selectedProjectId) return;
    setLineItems([mkRow()]);
  }, [open, selectedProjectId, mkRow]);

  /** Prefill line items from all logged hours on the selected project (by task). */
  useEffect(() => {
    if (!open || !selectedProjectId || !selectedProject) return;
    const data = projectHoursQuery.data;
    if (data === undefined) return;
    if (projectHoursQuery.isError) {
      setLineItems([mkRow()]);
      return;
    }
    if (data.length === 0) {
      setLineItems([mkRow()]);
      return;
    }
    setLineItems(
      data.map((r) =>
        mkRow({
          description: r.title,
          qty: r.hours,
          rate: defaultHourlyRate,
        }),
      ),
    );
  }, [
    open,
    selectedProjectId,
    selectedProject,
    selectedProject?.apiId,
    projectHoursQuery.data,
    projectHoursQuery.isError,
    mkRow,
    defaultHourlyRate,
  ]);

  const total = useMemo(
    () => lineItems.reduce((s, row) => s + row.qty * row.rate, 0),
    [lineItems],
  );

  const updateRow = useCallback((id: string, patch: Partial<LineRow>) => {
    setLineItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = useCallback((id: string) => {
    setLineItems((rows) => {
      if (rows.length <= 1) {
        return [mkRow()];
      }
      return rows.filter((r) => r.id !== id);
    });
  }, [mkRow]);

  const addRow = useCallback(() => {
    setLineItems((rows) => [...rows, mkRow()]);
  }, [mkRow]);

  const handleExportPdf = useCallback(async () => {
    if (!selectedProject?.apiId) {
      toast.error("Select a project to export.");
      return;
    }
    const lines = lineItems.filter((row) => row.qty * row.rate !== 0 || row.description.trim());
    if (lines.length === 0) {
      toast.error("Add at least one line item with hours or an amount.");
      return;
    }
    setExportPending(true);
    try {
      const { blob, filename } = await exportInvoicePreviewPdf({
        invoice_number: invoiceNumber.trim() || formatInvoiceDefaultNumber(new Date()),
        issued_on: issuedOn,
        project_id: selectedProject.apiId,
        line_items: lines.map((row) => ({
          description: row.description.trim() || "Line item",
          quantity: row.qty,
          rate: row.rate,
        })),
        tax_rate: 0,
        currency: user?.invoice_currency ?? undefined,
        due_terms: "Upon Receipt",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not export PDF. Try again or check invoice settings."));
    } finally {
      setExportPending(false);
    }
  }, [
    issuedOn,
    invoiceNumber,
    lineItems,
    selectedProject,
    user?.invoice_currency,
  ]);

  const onPickProject = useCallback((p: Project) => {
    setSelectedProjectId(p.id);
    setProjectPickerOpen(false);
    setProjectSearch("");
  }, []);

  const billToPrimary =
    !selectedProjectId
      ? null
      : waitingForProjectDetail
        ? "…"
        : clientIdForBill == null
          ? "N/A"
          : billClientLoading
            ? "…"
            : billClient?.name ?? "N/A";

  const billToSecondary =
    !selectedProjectId || clientIdForBill == null
      ? null
      : waitingForProjectDetail || billClientLoading
        ? null
        : billClient?.email ?? null;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto overflow-x-hidden bg-black/25 font-['Satoshi',sans-serif]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      {/* Centered panel: min-h-full allows vertical centering when short; long content scrolls the backdrop */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="my-8 flex w-full max-w-[600px] max-h-[min(90vh,880px)] flex-col overflow-hidden rounded-2xl border border-[#f5f5f5] bg-[#f9f9f9] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]">
          <div className="relative flex shrink-0 items-center justify-between border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={() => onOpenChange(false)} className="text-[#606d76]" aria-label="Back">
                  <ArrowLeft size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Back</TooltipContent>
            </Tooltip>
            <p
              id="invoice-modal-title"
              className="absolute left-1/2 -translate-x-1/2 text-[16px] font-medium tracking-[-0.16px] text-[#595959]"
            >
              Invoice
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={
                    exportPending ||
                    !selectedProject?.apiId ||
                    waitingForProjectDetail ||
                    billClientLoading
                  }
                  onClick={() => void handleExportPdf()}
                  className="h-10 rounded-lg bg-[#0b191f] px-4 text-sm font-semibold text-white outline-none ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-[rgba(96,109,118,0.2)] disabled:text-[#606d76]/70"
                >
                  {exportPending ? "Exporting…" : "Export PDF"}
                </button>
              </TooltipTrigger>
              <TooltipContent>Export invoice as PDF</TooltipContent>
            </Tooltip>
          </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden bg-[#f9f9f9] px-9 py-6 [scrollbar-gutter:stable]">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="mb-1 text-sm text-[#606d76]">Invoice</p>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#e9e9e9] bg-white px-4 text-sm text-[#252014] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Invoice number"
              />
            </div>
            <div>
              <p className="mb-1 text-sm text-[#606d76]">From</p>
              <p className="text-[16px] leading-[normal] text-[#252014]">{fromName}</p>
              <p className="text-sm text-[#727d83]">{fromEmail}</p>
            </div>

            <div>
              <p className="mb-1 text-sm text-[#606d76]">Issued on</p>
              <div
                className="relative flex h-10 cursor-pointer items-center rounded-lg border border-[#e9e9e9] bg-white px-4"
                role="button"
                tabIndex={0}
                onClick={openIssuedOnPicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openIssuedOnPicker();
                  }
                }}
              >
                <input
                  ref={issuedOnInputRef}
                  id="invoice-issued-on"
                  type="date"
                  value={issuedOn}
                  onChange={(e) => setIssuedOn(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="Issued on"
                />
                <span className="pointer-events-none flex-1 text-sm text-[#252014]">
                  {issuedOn
                    ? new Date(issuedOn + "T12:00:00").toLocaleDateString("en-ZA", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </span>
                <Calendar size={16} className="pointer-events-none shrink-0 text-[#252014]" aria-hidden />
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm text-[#606d76]">Bill to</p>
              {billToPrimary == null ? (
                <p className="text-sm text-[#9fa5a8]">Select a project</p>
              ) : (
                <>
                  <p className="truncate text-[16px] leading-[normal] text-[#252014]">{billToPrimary}</p>
                  {billToSecondary ? (
                    <p className="truncate text-sm text-[#727d83]">{billToSecondary}</p>
                  ) : null}
                </>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="mb-1 text-sm text-[#606d76]">Due</p>
              <div className="flex h-10 w-full items-center justify-between rounded-lg border border-[#e9e9e9] bg-white px-4 text-sm text-[#252014]">
                <span>Upon Receipt</span>
                <ChevronDown size={16} className="text-[#252014]" aria-hidden />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-[#e5e7eb]" />

          <div>
            <p className="mb-1 flex items-center gap-1 text-sm text-[#606d76]">
              Project <Info size={14} aria-hidden />
            </p>
            <Popover open={projectPickerOpen} onOpenChange={setProjectPickerOpen} modal={false}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-[212px] max-w-[212px] shrink-0 items-center justify-between rounded-lg border border-[#e9e9e9] bg-white px-4 text-left text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Select project"
                    >
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          selectedProject ? "text-[#252014]" : "text-[#9fa5a8]",
                        )}
                      >
                        {projectsPending
                          ? "Loading…"
                          : selectedProject
                            ? selectedProject.title
                            : "Select project"}
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-[#606d76]" strokeWidth={1.5} aria-hidden />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Select project for invoice</TooltipContent>
              </Tooltip>
              <PopoverContent
                align="start"
                side="bottom"
                sideOffset={6}
                className="z-[100] w-[212px] min-w-[212px] max-w-[212px] border border-solid border-[#e9e9e9] p-0 shadow-lg"
                onOpenAutoFocus={(e) => {
                  e.preventDefault();
                  projectSearchInputRef.current?.focus();
                }}
              >
                <div className="flex max-h-[min(320px,70vh)] min-h-[168px] flex-col overflow-hidden rounded-[8px] bg-white">
                  <div className="flex shrink-0 items-center gap-2 border-b border-[#f0f0f0] px-3 py-2">
                    <Search className="size-4 shrink-0 text-[#9fa5a8]" strokeWidth={2} />
                    <input
                      ref={projectSearchInputRef}
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search projects…"
                      className="min-w-0 flex-1 border-0 bg-transparent font-['Satoshi',sans-serif] text-[13px] text-[#0b191f] outline-none placeholder:text-[#9fa5a8]"
                      aria-label="Search projects"
                    />
                  </div>
                  <div className="scrollbar-hide min-h-[120px] max-h-[240px] overflow-y-auto py-1">
                    {projectsPending ? (
                      <p className="px-3 py-2 text-center font-['Satoshi',sans-serif] text-[12px] text-[#9fa5a8]">
                        Loading…
                      </p>
                    ) : filteredProjects.length === 0 ? (
                      <p className="px-3 py-2 text-center font-['Satoshi',sans-serif] text-[12px] text-[#9fa5a8]">
                        {apiProjects.length === 0 ? "No projects" : "No matches"}
                      </p>
                    ) : (
                      filteredProjects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onPickProject(p)}
                          className={cn(
                            "flex w-full flex-col gap-0.5 px-3 py-2 text-left font-['Satoshi',sans-serif] text-[13px] transition-colors hover:bg-[#f5f7f8]",
                            selectedProjectId === p.id && "bg-[#f0f8ff]",
                          )}
                        >
                          <span className="flex w-full items-center gap-2">
                            <span className="min-w-0 flex-1 truncate text-[#0b191f]">{p.title}</span>
                            {selectedProjectId === p.id ? (
                              <Check className="size-3.5 shrink-0 text-[#2798f5]" strokeWidth={2} />
                            ) : null}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4">
            {lineItems.map((item) => {
              const itemTotal = item.qty * item.rate;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[20px_1fr_minmax(4.5rem,5.5rem)_minmax(5rem,6rem)_84px_16px] items-end gap-2"
                >
                  <GripVertical size={16} className="mb-2 text-[#9fa5a8]" aria-hidden />
                  <div>
                    <p className="mb-1 text-sm text-[#606d76]">Items</p>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateRow(item.id, { description: e.target.value })}
                      placeholder="Sprint/Delivery name"
                      className="h-10 w-full rounded-lg border border-[#e9e9e9] bg-white px-4 text-sm text-[#252014] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-[#606d76]">Qty</p>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={Number.isFinite(item.qty) ? item.qty : 0}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        updateRow(item.id, { qty: Number.isFinite(v) ? v : 0 });
                      }}
                      className={`h-10 w-full min-w-0 rounded-lg border border-[#e9e9e9] bg-white px-2 text-center text-sm text-[#252014] outline-none focus-visible:ring-2 focus-visible:ring-ring ${noNumberSpinner}`}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-[#606d76]">Rate</p>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={Number.isFinite(item.rate) ? item.rate : 0}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        updateRow(item.id, { rate: Number.isFinite(v) ? v : 0 });
                      }}
                      className={`h-10 w-full min-w-0 rounded-lg border border-[#e9e9e9] bg-white px-2 text-center text-sm text-[#252014] outline-none focus-visible:ring-2 focus-visible:ring-ring ${noNumberSpinner}`}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-right text-sm text-[#606d76]">Total</p>
                    <div className="h-10 leading-10 text-right text-sm text-[#252014]">
                      {money(itemTotal)}
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="mb-2 text-[#9fa5a8] hover:text-[#606d76]"
                        aria-label="Remove line"
                      >
                        <Trash2 size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remove line item</TooltipContent>
                  </Tooltip>
                </div>
              );
            })}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-2 text-[#252014]"
                >
                  <Plus size={20} />
                  <span className="text-sm font-medium">Add an item</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Add invoice line item</TooltipContent>
            </Tooltip>
          </div>
        </div>

          <div className="flex shrink-0 items-center justify-between border-t border-[#e5e7eb] bg-[#f9f9f9] px-9 py-4">
            <p className="text-sm text-[#606d76]">Total</p>
            <p className="text-2xl font-medium text-[#252014]">{money(total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
