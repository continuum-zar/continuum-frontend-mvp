import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  GripVertical,
  Info,
  Plus,
  Trash2,
} from "lucide-react";

type InvoiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Stage = "empty" | "client" | "full";

type InvoiceItem = {
  id: number;
  name: string;
  qty: number;
  rate: number;
};

const FULL_ITEMS: InvoiceItem[] = [
  { id: 1, name: "User Research & Current Dashboard Audit", qty: 55, rate: 200 },
  { id: 2, name: "Low-Fidelity Wireframes & UX Flow Iterations", qty: 37, rate: 200 },
  { id: 3, name: "High-Fidelity UI Design & Component System", qty: 60, rate: 200 },
];

const money = (value: number) =>
  `R${value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function InvoiceModal({ open, onOpenChange }: InvoiceModalProps) {
  const [stage, setStage] = useState<Stage>("empty");

  const items = useMemo<InvoiceItem[]>(
    () =>
      stage === "full"
        ? FULL_ITEMS
        : [{ id: 0, name: "Sprint/Delivery name", qty: 1, rate: 0 }],
    [stage]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.rate, 0),
    [items]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/25 p-6 font-['Satoshi',sans-serif]">
      <div className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-[#f5f5f5] bg-[#f9f9f9] shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]">
        <div className="relative flex items-center justify-between border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
          <button type="button" onClick={() => onOpenChange(false)} className="text-[#606d76]">
            <ArrowLeft size={20} />
          </button>
          <p className="absolute left-1/2 -translate-x-1/2 text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
            Invoice
          </p>
          <button
            type="button"
            disabled
            className={`h-10 rounded-lg px-4 text-sm font-semibold ${
              stage === "full"
                ? "opacity-0"
                : "bg-[rgba(96,109,118,0.1)] text-[#606d76]/50"
            }`}
          >
            Generate invoice
          </button>
        </div>

        <div className="space-y-6 bg-[#f9f9f9] px-9 py-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="mb-1 text-sm text-[#606d76]">Invoice</p>
              <div className="h-10 rounded-lg border border-[#e9e9e9] bg-white px-4 leading-10 text-sm text-[#252014]">
                INV-2025-02
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm text-[#606d76]">From</p>
              <p className="text-[16px] leading-[normal] text-[#252014]">Amukelani Shiringani</p>
              <p className="text-sm text-[#727d83]">amushiringani@gmail.com</p>
            </div>

            <div>
              <p className="mb-1 text-sm text-[#606d76]">Issued on</p>
              <div className="flex h-10 items-center justify-between rounded-lg border border-[#e9e9e9] bg-white px-4 text-sm text-[#252014]">
                <span>16/12/3025</span>
                <Calendar size={16} className="text-[#252014]" />
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm text-[#606d76]">Bill to</p>
              {stage === "empty" ? (
                <button
                  type="button"
                  onClick={() => setStage("client")}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-[#e9e9e9] bg-white px-4 text-sm text-[#9fa5a8]"
                >
                  <span>Select client</span>
                  <ChevronDown size={16} />
                </button>
              ) : (
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] leading-[normal] text-[#252014]">
                      Meta Technologies (Pty) Ltd
                    </p>
                    <p className="truncate text-sm text-[#727d83]">
                      invoice@metatechnologies.com
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStage("empty")}
                    className="h-10 text-[#9fa5a8]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <p className="mb-1 text-sm text-[#606d76]">Due</p>
              <button type="button" className="flex h-10 w-full items-center justify-between rounded-lg border border-[#e9e9e9] bg-white px-4 text-sm text-[#252014]">
                <span>Upon Receipt</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-[#e5e7eb]" />

          <div>
            <p className="mb-1 flex items-center gap-1 text-sm text-[#606d76]">
              Project <Info size={14} />
            </p>
            <button
              type="button"
              onClick={() => stage !== "empty" && setStage("full")}
              className="flex h-10 w-[332px] items-center justify-between rounded-lg border border-[#e9e9e9] bg-white px-4 text-sm"
            >
              <span className={stage === "full" ? "text-[#252014]" : "text-[#9fa5a8]"}>
                {stage === "full" ? "Meta Tech Dashboard Overhaul" : "Select Project"}
              </span>
              <ChevronDown size={16} className="text-[#252014]" />
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => {
              const itemTotal = item.qty * item.rate;
              return (
                <div key={item.id} className="grid grid-cols-[20px_1fr_40px_90px_84px_16px] items-end gap-2">
                  <GripVertical size={16} className="mb-2 text-[#9fa5a8]" />
                  <div>
                    <p className="mb-1 text-sm text-[#606d76]">Items</p>
                    <div className="h-10 rounded-lg border border-[#e9e9e9] bg-white px-4 leading-10 text-sm text-[#252014] truncate">
                      {item.name}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-[#606d76]">Qty</p>
                    <div className="h-10 rounded-lg border border-[#e9e9e9] bg-white text-center leading-10 text-sm text-[#252014]">
                      {item.qty}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-[#606d76]">Rate</p>
                    <div className="h-10 rounded-lg border border-[#e9e9e9] bg-white text-center leading-10 text-sm text-[#252014]">
                      {money(item.rate)}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-[#606d76] text-right">Total</p>
                    <div className="h-10 leading-10 text-right text-sm text-[#252014]">
                      {money(itemTotal)}
                    </div>
                  </div>
                  <button type="button" className="mb-2 text-[#9fa5a8]">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}

            <button type="button" className="inline-flex items-center gap-2 text-[#252014]">
              <Plus size={20} />
              <span className="text-sm font-medium">Add an items</span>
            </button>
          </div>

          <div className="h-px w-full bg-[#e5e7eb]" />

          <div className="flex items-center justify-between">
            <p className="text-sm text-[#606d76]">Total</p>
            {stage === "full" ? (
              <button
                type="button"
                className="h-10 rounded-xl px-5 text-sm font-semibold text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(172deg, #24B5F8 123.02%, #5521FE 802.55%), linear-gradient(112deg, #24B5F8 1.258%, #5521FE 269.28%), linear-gradient(90deg, #24B5F8 0%, #24B5F8 100%)",
                }}
              >
                {`${money(total)}  ·  Generate invoice`}
              </button>
            ) : (
              <p className="text-2xl font-medium text-[#252014]">{money(total)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
