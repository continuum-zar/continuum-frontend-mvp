import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactElement } from "react";
import { toast } from "sonner";

import { AddTaskResourceModal, type TaskResourcePendingUploadRow } from "./AddTaskResourceModal";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("@/api/hooks", () => ({
  getApiErrorMessage: (e: unknown, fb: string) => (e instanceof Error ? e.message : fb),
  useAddAttachmentLink: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const uploadTaskAttachment = vi.fn();

vi.mock("@/api/tasks", () => ({
  uploadTaskAttachment: (...args: unknown[]) => uploadTaskAttachment(...args),
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

function mockDataTransferWithFiles(fileList: File[]): DataTransfer {
  const files = {
    length: fileList.length,
    item: (i: number) => fileList[i] ?? null,
    ...Object.fromEntries(fileList.map((f, i) => [i, f])),
    [Symbol.iterator]: function* () {
      for (const f of fileList) yield f;
    },
  } as FileList;

  return {
    dropEffect: "none",
    effectAllowed: "all",
    files,
    types: fileList.length ? ["Files"] : [],
    clearData: () => {},
    getData: () => "",
    setData: () => {},
    setDragImage: () => {},
  } as unknown as DataTransfer;
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: Object.assign(files, {
      item: (i: number) => files[i] ?? null,
      length: files.length,
    }) as FileList,
  });
}

function renderModal(
  ui: ReactElement,
  options?: { client?: QueryClient },
) {
  const client = options?.client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("AddTaskResourceModal", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.message).mockClear();
    uploadTaskAttachment.mockReset();
  });

  it("renders a file drop region with an accessible name", () => {
    renderModal(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    expect(screen.getByRole("region", { name: /file upload/i })).toBeInTheDocument();
    expect(screen.getByText(/drop files here/i)).toBeInTheDocument();
  });

  it("sets the selected file when a file is dropped on the zone", () => {
    renderModal(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    const zone = screen.getByRole("region", { name: /file upload/i });
    const file = new File(["hello"], "dropped.txt", { type: "text/plain" });
    fireEvent.drop(zone, { dataTransfer: mockDataTransferWithFile(file) });

    expect(screen.getByText("dropped.txt")).toBeInTheDocument();
    expect(screen.queryByText(/drop files here/i)).not.toBeInTheDocument();
  });

  it("accepts multiple dropped files and lists each with remove controls", () => {
    renderModal(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    const zone = screen.getByRole("region", { name: /file upload/i });
    const a = new File(["a"], "one.txt", { type: "text/plain" });
    const b = new File(["bb"], "two.txt", { type: "text/plain" });
    fireEvent.drop(zone, { dataTransfer: mockDataTransferWithFiles([a, b]) });

    const list = screen.getByRole("list", { name: /selected files/i });
    expect(within(list).getByText("one.txt")).toBeInTheDocument();
    expect(within(list).getByText("two.txt")).toBeInTheDocument();
    expect(within(list).getAllByRole("button", { name: /remove/i })).toHaveLength(2);
  });

  it("selects multiple files via the hidden input and shows all in the list", () => {
    renderModal(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    const input = document.getElementById("add-task-resource-file-input");
    if (!(input instanceof HTMLInputElement)) throw new Error("expected file input");
    const f1 = new File(["a"], "alpha.png", { type: "image/png" });
    const f2 = new File(["bb"], "beta.png", { type: "image/png" });
    setInputFiles(input, [f1, f2]);
    fireEvent.change(input);

    expect(screen.getByText("alpha.png")).toBeInTheDocument();
    expect(screen.getByText("beta.png")).toBeInTheDocument();
  });

  it("highlights the drop zone while dragging files over it", () => {
    renderModal(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
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
    renderModal(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    const zone = screen.getByRole("region", { name: /file upload/i });
    const huge = new File([], "big.bin", { type: "application/octet-stream" });
    Object.defineProperty(huge, "size", { value: MAX_BYTES + 1 });

    fireEvent.drop(zone, { dataTransfer: mockDataTransferWithFile(huge) });

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("big.bin"));
    expect(screen.queryByText("big.bin")).not.toBeInTheDocument();
  });

  it("removes a pending file when its remove control is activated", async () => {
    const user = userEvent.setup();
    renderModal(<AddTaskResourceModal open onOpenChange={() => {}} taskId="99" />);
    const zone = screen.getByRole("region", { name: /file upload/i });
    const file = new File(["x"], "solo.txt", { type: "text/plain" });
    fireEvent.drop(zone, { dataTransfer: mockDataTransferWithFile(file) });

    await user.click(screen.getByRole("button", { name: /remove solo\.txt/i }));
    expect(screen.queryByText("solo.txt")).not.toBeInTheDocument();
    expect(screen.getByText(/drop files here/i)).toBeInTheDocument();
  });

  it("uploads every pending file, updates pending rows, then closes", async () => {
    const user = userEvent.setup();
    uploadTaskAttachment.mockImplementation(() =>
      Promise.resolve({
        id: 1,
        original_filename: "ok",
        file_size: 1,
        mime_type: "text/plain",
        created_at: new Date().toISOString(),
      }),
    );

    function Harness() {
      const [rows, setRows] = useState<TaskResourcePendingUploadRow[]>([]);
      const [open, setOpen] = useState(true);
      return (
        <div>
          <AddTaskResourceModal
            open={open}
            onOpenChange={setOpen}
            taskId="99"
            setPendingUploadRows={setRows}
          />
          <ul aria-label="synced rows">
            {rows.map((r) => (
              <li key={r.clientId}>
                {r.filename}:{r.status}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    renderModal(<Harness />);
    const zone = screen.getByRole("region", { name: /file upload/i });
    fireEvent.drop(
      zone,
      {
        dataTransfer: mockDataTransferWithFiles([
          new File(["a"], "first.txt", { type: "text/plain" }),
          new File(["bb"], "second.txt", { type: "text/plain" }),
        ]),
      },
    );

    await user.click(screen.getByRole("button", { name: /^add resource$/i }));

    await waitFor(() => {
      expect(uploadTaskAttachment).toHaveBeenCalledTimes(2);
    });
    expect(uploadTaskAttachment.mock.calls[0]?.[1]?.name).toBe("first.txt");
    expect(uploadTaskAttachment.mock.calls[1]?.[1]?.name).toBe("second.txt");

    await waitFor(() => {
      expect(screen.queryByRole("list", { name: /selected files/i })).not.toBeInTheDocument();
    });
    expect(toast.success).toHaveBeenCalledWith("2 attachments uploaded");
    const synced = screen.getByRole("list", { name: /synced rows/i });
    expect(synced.querySelectorAll("li")).toHaveLength(0);
  });

  it("records per-file errors in pending rows when an upload fails", async () => {
    const user = userEvent.setup();
    uploadTaskAttachment
      .mockResolvedValueOnce({
        id: 1,
        original_filename: "ok",
        file_size: 1,
        mime_type: "text/plain",
        created_at: new Date().toISOString(),
      })
      .mockRejectedValueOnce(new Error("network"));

    function Harness() {
      const [rows, setRows] = useState<TaskResourcePendingUploadRow[]>([]);
      return (
        <div>
          <AddTaskResourceModal open onOpenChange={() => {}} taskId="99" setPendingUploadRows={setRows} />
          <ul aria-label="synced rows">
            {rows.map((r) => (
              <li key={r.clientId}>
                {r.filename}:{r.status}:{r.errorMessage ?? ""}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    renderModal(<Harness />);
    const zone = screen.getByRole("region", { name: /file upload/i });
    fireEvent.drop(
      zone,
      {
        dataTransfer: mockDataTransferWithFiles([
          new File(["a"], "good.txt", { type: "text/plain" }),
          new File(["b"], "bad.txt", { type: "text/plain" }),
        ]),
      },
    );

    await user.click(screen.getByRole("button", { name: /^add resource$/i }));

    await waitFor(() => expect(uploadTaskAttachment).toHaveBeenCalledTimes(2));

    await waitFor(() => {
      expect(screen.getByText(/bad\.txt:error:network/)).toBeInTheDocument();
    });
    expect(toast.message).toHaveBeenCalled();
  });
});
