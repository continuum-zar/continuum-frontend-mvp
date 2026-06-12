/**
 * Drag-and-drop / browse zone for the migration upload screen.
 *
 * Lifts the drag-depth idiom verbatim from
 * `src/app/components/AddTaskResourceModal.tsx` (lines 138-165) so the
 * nested-enter / nested-leave counting that prevents flicker on Mac Safari
 * is identical to the canonical reference. Sticking to the existing
 * pattern was a load-bearing requirement.
 *
 * The 50 MB client guard mirrors the backend's `MIGRATIONS_MAX_UPLOAD_SIZE`
 * cap (architecture doc §6). Files larger than that are rejected client-side
 * with a toast so we never pay the upload cost.
 */

import * as React from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";

/** Matches the backend cap. Update both sides together. */
export const MIGRATION_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [".csv", ".json"];
const ALLOWED_MIME_PREFIXES = ["text/", "application/json", "application/csv"];

interface MigrationDropzoneProps {
    file: File | null;
    onFileChosen: (file: File) => void;
    onCleared: () => void;
    disabled?: boolean;
    busyLabel?: string;
}

function looksAllowed(file: File): boolean {
    const lowerName = file.name.toLowerCase();
    if (ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) return true;
    if (ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p))) return true;
    return false;
}

export function MigrationDropzone({
    file,
    onFileChosen,
    onCleared,
    disabled,
    busyLabel,
}: MigrationDropzoneProps) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const dragDepthRef = React.useRef(0);
    const [isFileDragActive, setIsFileDragActive] = React.useState(false);

    const dataTransferHasFiles = (dt: DataTransfer) => [...dt.types].includes("Files");

    const validateAndAccept = React.useCallback(
        (chosen: File) => {
            if (chosen.size > MIGRATION_MAX_UPLOAD_BYTES) {
                toast.error(
                    `File is over the 50 MB limit. Split your export and upload the parts separately.`,
                );
                return;
            }
            if (!looksAllowed(chosen)) {
                toast.error(
                    "Unsupported file type. Continuum imports accept CSV and JSON.",
                );
                return;
            }
            onFileChosen(chosen);
        },
        [onFileChosen],
    );

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (!dataTransferHasFiles(e.dataTransfer)) return;
        dragDepthRef.current += 1;
        setIsFileDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setIsFileDragActive(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (dataTransferHasFiles(e.dataTransfer)) {
            e.dataTransfer.dropEffect = "copy";
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        dragDepthRef.current = 0;
        setIsFileDragActive(false);
        const list = e.dataTransfer.files;
        if (!list?.length) return;
        validateAndAccept(list[0]);
    };

    const handleBrowseClick = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const chosen = e.target.files?.[0];
        e.target.value = "";
        if (chosen) validateAndAccept(chosen);
    };

    if (file && busyLabel) {
        return (
            <div className="flex items-center justify-center gap-3 rounded-md border border-border bg-card px-6 py-10 text-sm">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-muted-foreground">{busyLabel}</span>
            </div>
        );
    }

    if (file) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove file"
                    onClick={onCleared}
                    disabled={disabled}
                >
                    <X aria-hidden="true" />
                </Button>
            </div>
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label="Upload an export file"
            aria-disabled={disabled || undefined}
            onClick={handleBrowseClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleBrowseClick();
                }
            }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isFileDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30 hover:bg-muted/50",
                disabled && "pointer-events-none opacity-60",
            )}
        >
            <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
            <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                    Drop your export here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                    CSV or JSON · up to 50 MB
                </p>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept=".csv,.json,text/csv,application/json,application/csv,text/plain"
                className="hidden"
                onChange={handleInputChange}
            />
        </div>
    );
}
