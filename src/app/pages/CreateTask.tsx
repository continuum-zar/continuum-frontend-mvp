import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  Loader2,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../components/ui/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import api from '../../lib/api';
import { generateTasks, useUploadPlannerFile, type FileContent } from '@/api';
import { getApiErrorMessage } from '../../api/hooks';
import { aiPlannerComposerPlusSrc } from '../assets/dashboardPlaceholderAssets';

type AiChatAttachment = {
  id: string;
  fileContent: FileContent;
  isImage: boolean;
  /** Object URL for pasted or picked images (revoked on remove / unmount). */
  previewUrl?: string;
};

interface LocationState {
  projectId?: string | number;
  milestoneId?: string | number;
}

export function CreateTask() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};

  const projectId = state.projectId;
  const milestoneId = state.milestoneId;

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiChatAttachments, setAiChatAttachments] = useState<AiChatAttachment[]>([]);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const aiAttachmentsRef = useRef(aiChatAttachments);
  aiAttachmentsRef.current = aiChatAttachments;

  const uploadMutation = useUploadPlannerFile();

  useEffect(() => {
    return () => {
      for (const a of aiAttachmentsRef.current) {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    scope: 'M',
    estimatedHours: '',
    dueDate: '',
  });

  const [checklists, setChecklists] = useState<string[]>([]);
  const [newChecklist, setNewChecklist] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [errors, setErrors] = useState<{
    estimatedHours?: string;
    dueDate?: string;
  }>({});

  const localDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    // Validate estimatedHours (non-negative, finite)
    if (formData.estimatedHours.trim() !== '') {
      const hours = Number(formData.estimatedHours);
      if (!Number.isFinite(hours) || hours < 0) {
        newErrors.estimatedHours = 'Must be a non-negative finite number';
      }
    }

    // Validate dueDate (compare with local calendar day; matches <input type="date">)
    if (formData.dueDate) {
      const today = localDateString(new Date());
      if (formData.dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddChecklist = () => {
    if (newChecklist.trim()) {
      setChecklists([...checklists, newChecklist.trim()]);
      setNewChecklist('');
    }
  };

  const handleRemoveChecklist = (index: number) => {
    setChecklists(checklists.filter((_, i) => i !== index));
  };

  const addUploadedFile = useCallback((file: File, content: FileContent) => {
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
    setAiChatAttachments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        fileContent: content,
        isImage,
        previewUrl,
      },
    ]);
  }, []);

  const handleAiFilesSelected = async (files: File[]) => {
    for (const file of files) {
      try {
        const result = await uploadMutation.mutateAsync(file);
        addUploadedFile(file, result);
        toast.success(`Uploaded ${result.filename}`);
      } catch {
        // Error toast from useUploadPlannerFile
      }
    }
    if (aiFileInputRef.current) aiFileInputRef.current.value = '';
  };

  const handleAiFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    await handleAiFilesSelected(Array.from(list));
  };

  const handleRemoveAiAttachment = (id: string) => {
    setAiChatAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!projectId) {
      toast.error('Select a project first (e.g. from the project board) to use AI generation.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateTasks(Number(projectId), {
        prompt: prompt.trim(),
        max_tasks: 1,
        file_contents: aiChatAttachments.map((a) => a.fileContent),
      });
      const task = res.tasks?.[0];
      if (!task) {
        toast.error('No task suggestions returned. Try a different prompt or ensure the project is indexed.');
        return;
      }
      setFormData({
        title: task.title,
        description: task.description ?? '',
        status: 'todo',
        scope: task.scope_weight,
        estimatedHours: '',
        dueDate: '',
      });
      setChecklists((task.checklist ?? []).map((c) => c.title));
      setLabels(Array.isArray(task.labels) ? task.labels.filter((l) => l && String(l).trim()) : []);
      toast.success('Task details filled from AI. Edit as needed and create.');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'AI generation failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!validate()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Map frontend status to backend status format
      const backendStatus = formData.status === 'in-progress' ? 'in_progress' : formData.status;

      // Build the payload
      const payload: {
        title: string;
        description: string;
        status: string;
        scope_weight: string;
        project_id?: number;
        milestone_id?: number;
        estimated_hours?: number;
        due_date?: string;
        checklists?: Array<{ text: string; done: boolean }>;
        labels?: string[];
      } = {
        title: formData.title,
        description: formData.description,
        status: backendStatus,
        scope_weight: formData.scope,
        ...(projectId && { project_id: Number(projectId) }),
        ...(milestoneId && { milestone_id: Number(milestoneId) }),
        ...(formData.estimatedHours && { estimated_hours: Number(formData.estimatedHours) }),
        ...(formData.dueDate && { due_date: formData.dueDate }),
        ...(checklists.length > 0 && {
          checklists: checklists.map((text) => ({ text, done: false })),
        }),
        ...(labels.length > 0 && { labels }),
      };

      // Call the API
      const response = await api.post('/tasks/', payload);

      toast.success('Task created. Add attachments on the task page.');

      // Redirect to task detail so user can add attachments there (see README)
      navigate(`/tasks/${response.data.id}`, {
        state: projectId ? { projectId, fromCreate: true } : undefined,
      });
    } catch (err: unknown) {
      console.error('Failed to create task:', err);
      toast.error(getApiErrorMessage(err, 'Failed to create task'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl mb-1">Create Task</h1>
            <p className="text-muted-foreground">
              Create a new task manually or generate one with AI
            </p>
          </div>
        </div>

        {/* Manual Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope">Scope</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(val) => setFormData({ ...formData, scope: val })}
                >
                  <SelectTrigger id="scope">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XS">Extra Small (XS)</SelectItem>
                    <SelectItem value="S">Small (S)</SelectItem>
                    <SelectItem value="M">Medium (M)</SelectItem>
                    <SelectItem value="L">Large (L)</SelectItem>
                    <SelectItem value="XL">Extra Large (XL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => {
                    setFormData({ ...formData, estimatedHours: e.target.value });
                    if (errors.estimatedHours) setErrors({ ...errors, estimatedHours: undefined });
                  }}
                  placeholder="e.g., 4"
                  className={errors.estimatedHours ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors.estimatedHours && (
                  <p className="text-xs text-destructive flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.estimatedHours}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => {
                    setFormData({ ...formData, dueDate: e.target.value });
                    if (errors.dueDate) setErrors({ ...errors, dueDate: undefined });
                  }}
                  className={errors.dueDate ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {errors.dueDate && (
                  <p className="text-xs text-destructive flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.dueDate}
                  </p>
                )}
              </div>
            </div>

            {/* Checklists Section */}
            <div className="space-y-3">
              <Label>Checklist Items</Label>
              <div className="flex space-x-2">
                <Input
                  value={newChecklist}
                  onChange={(e) => setNewChecklist(e.target.value)}
                  placeholder="Add a checklist item..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklist();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddChecklist}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {checklists.length > 0 && (
                <div className="space-y-2 mt-3">
                  {checklists.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded border border-border">
                      <span className="text-sm">{item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveChecklist(index)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Labels (AI-populated or empty) */}
            {labels.length > 0 && (
              <div className="space-y-2">
                <Label>Labels</Label>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => setLabels(labels.filter((_, i) => i !== index))}
                        className="rounded hover:bg-muted-foreground/20 p-0.5"
                        aria-label={`Remove ${label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              You can add attachments on the task page after creating it.
            </p>

            <div className="pt-4 border-t border-border flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Floating AI Assistant — composer pattern aligned with AI Project Planner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 right-8 z-50 w-[min(100vw-2rem,22rem)] p-4 bg-card border border-border rounded-lg shadow-lg"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground text-sm mb-1">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {projectId
                ? 'Describe the task, attach files or images, then generate.'
                : 'Select a project first (e.g. from the project board) to use AI.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {aiChatAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Attachments for AI generation">
              {aiChatAttachments.map((a) =>
                a.isImage && a.previewUrl ? (
                  <span
                    key={a.id}
                    className="relative inline-flex overflow-hidden rounded-[8px] border border-solid border-[#ededed] bg-white shadow-sm"
                  >
                    <img
                      src={a.previewUrl}
                      alt={a.fileContent.filename}
                      className="h-[72px] w-[72px] object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAiAttachment(a.id)}
                      className="absolute right-0.5 top-0.5 inline-flex size-6 items-center justify-center rounded-md bg-black/50 text-white hover:bg-black/70"
                      aria-label={`Remove image ${a.fileContent.filename}`}
                    >
                      <X className="size-3.5" strokeWidth={2} />
                    </button>
                  </span>
                ) : (
                  <span
                    key={a.id}
                    className="inline-flex max-w-full items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] bg-white shadow-sm"
                  >
                    <span
                      className="flex w-9 shrink-0 items-center justify-center self-stretch bg-[#edf0f3]"
                      aria-hidden
                    >
                      <FileText
                        className="size-4 shrink-0 text-[#606d76]"
                        strokeWidth={1.75}
                      />
                    </span>
                    <span className="min-w-0 max-w-[180px] truncate border-l border-solid border-[#ededed] px-2.5 py-1.5 font-['Satoshi',sans-serif] text-[13px] font-medium leading-normal text-[#0b191f]">
                      {a.fileContent.filename}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAiAttachment(a.id)}
                      className="inline-flex shrink-0 items-center justify-center self-center pr-1.5 text-[#606d76] hover:text-[#0b191f]"
                      aria-label={`Remove ${a.fileContent.filename}`}
                    >
                      <X className="size-3.5" strokeWidth={2} />
                    </button>
                  </span>
                ),
              )}
            </div>
          )}

          <input
            ref={aiFileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,.txt,.md,.pdf,.doc,.docx"
            onChange={handleAiFileInputChange}
          />

          <div
            className={cn(
              'overflow-hidden rounded-[14px] border border-solid border-[#edecea] bg-white shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]',
            )}
          >
            <div className="relative flex min-h-[88px] shrink-0 flex-col gap-1 bg-white pb-[7px] pt-[11px]">
              <div className="relative flex w-full min-h-0 items-start justify-center px-[13px]">
                <label className="sr-only" htmlFor="create-task-ai-prompt">
                  Describe the task for AI generation
                </label>
                <TextareaAutosize
                  id="create-task-ai-prompt"
                  data-slot="textarea"
                  placeholder='e.g., "Add playwright tests..."'
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  minRows={2}
                  maxRows={9}
                  disabled={isGenerating}
                  onPaste={(e) => {
                    const { files } = e.clipboardData;
                    if (files?.length) {
                      e.preventDefault();
                      void handleAiFilesSelected(Array.from(files));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleGenerate();
                    }
                  }}
                  className="max-h-[200px] min-h-[40px] w-full resize-none overflow-y-auto border-0 bg-transparent font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[1.35] tracking-[-0.13px] text-[#0b191f] opacity-50 placeholder:text-[#727d83] placeholder:opacity-50 focus:opacity-100 focus:outline-none focus:ring-0 disabled:opacity-40"
                />
              </div>
              <div className="flex shrink-0 items-center justify-between px-[11px]">
                <button
                  type="button"
                  onClick={() => aiFileInputRef.current?.click()}
                  disabled={uploadMutation.isPending || isGenerating || !projectId}
                  className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center p-0 disabled:opacity-50"
                  aria-label="Attach file or image"
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin text-[#727d83]" aria-hidden />
                  ) : (
                    <img
                      src={aiPlannerComposerPlusSrc}
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] object-contain"
                      aria-hidden
                    />
                  )}
                </button>
                <Button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={isGenerating || !prompt.trim() || !projectId}
                  size="sm"
                  className="h-8 shrink-0 bg-foreground text-background hover:bg-foreground/90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
