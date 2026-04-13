import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { toast } from "sonner";

import { AddTaskResourceModal } from "./AddTaskResourceModal";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/api/hooks", () => ({
  useUploadAttachment: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useAddAttachmentLink: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const MAX_BYTES = 50 * 1024 * 1024;

/** jsdom does not implement a usable `DataTransfer` constructor; tests only need `types` + `files`. */
function mockDataTransferWithFile(file: File | null): DataTransfer {
  const files =
    file == null
      ? ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} } as FileList)
      : ({
          0: file,
          length: 1,
          item: (i: number) => (i === 0 ? file : null),
          [Symbol.iterator]: function* () {
            yield file;
          },
        } as FileList);

  return {
    dropEffect: "none",
    effectAllowed: "all",
    files,
    types: file ? ["Files"] : [],
    clearData: () => {},
    getData: () => "",
    setData: () => {},
    setDragImage: () => {},
  } as unknown as DataTransfer;
}

function setInputFiles(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: Object.assign([file], {
      item: (i: number) => (i === 0 ? file : null),
    }) as FileList,
  });
}

describe("AddTaskResourceModal", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
  });

  it("renders a file drop region with an accessible name", () => {
    render(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    expect(screen.getByRole("region", { name: /file upload/i })).toBeInTheDocument();
    expect(screen.getByText(/drop a file here/i)).toBeInTheDocument();
  });

  it("sets the selected file when a file is dropped on the zone", () => {
    render(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    const zone = screen.getByRole("region", { name: /file upload/i });
    const file = new File(["hello"], "dropped.txt", { type: "text/plain" });
    fireEvent.drop(zone, { dataTransfer: mockDataTransferWithFile(file) });

    expect(screen.getByText("dropped.txt")).toBeInTheDocument();
    expect(screen.queryByText(/drop a file here/i)).not.toBeInTheDocument();
  });

  it("highlights the drop zone while dragging files over it", () => {
    render(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    const zone = screen.getByRole("region", { name: /file upload/i });
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    const dataTransfer = mockDataTransferWithFile(file);

    expect(zone).toHaveAttribute("data-drag-active", "false");

    fireEvent.dragEnter(zone, { dataTransfer });
    expect(zone).toHaveAttribute("data-drag-active", "true");

    fireEvent.dragLeave(zone, { dataTransfer });
    expect(zone).toHaveAttribute("data-drag-active", "false");
  });

  it("rejects files over 50 MB and shows an error toast", () => {
    render(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    const zone = screen.getByRole("region", { name: /file upload/i });
    const huge = new File([], "big.bin", { type: "application/octet-stream" });
    Object.defineProperty(huge, "size", { value: MAX_BYTES + 1 });

    fireEvent.drop(zone, { dataTransfer: mockDataTransferWithFile(huge) });

    expect(toast.error).toHaveBeenCalledWith("File is too large. Maximum size is 50 MB.");
    expect(screen.queryByText("big.bin")).not.toBeInTheDocument();
  });

  it("uses the same selection logic when picking a file via the hidden input", () => {
    render(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    const input = document.getElementById("add-task-resource-file-input");
    if (!(input instanceof HTMLInputElement)) throw new Error("expected file input");
    const file = new File(["content"], "picked.pdf", { type: "application/pdf" });
    setInputFiles(input, file);
    fireEvent.change(input);

    expect(screen.getByText("picked.pdf")).toBeInTheDocument();
  });
});
