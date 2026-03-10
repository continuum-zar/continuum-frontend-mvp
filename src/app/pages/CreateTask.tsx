import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import api from '../../lib/api';

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

  const handleAddChecklist = () => {
    if (newChecklist.trim()) {
      setChecklists([...checklists, newChecklist.trim()]);
      setNewChecklist('');
    }
  };

  const handleRemoveChecklist = (index: number) => {
    setChecklists(checklists.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      setFormData({
        title: 'Add Playwright E2E tests',
        description: 'Set up Playwright and write initial end-to-end tests for the main user flows including authentication and dashboard navigation.',
        status: 'todo',
        scope: 'L',
        estimatedHours: '8',
        dueDate: '2026-03-01',
      });
      setChecklists([
        'Install playwright dependencies',
        'Configure playwright.config.ts',
        'Write authentication test suite',
        'Write dashboard navigation test suite',
        'Add test scripts to package.json'
      ]);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Task title is required');
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
      } = {
        title: formData.title,
        description: formData.description,
        status: backendStatus,
        scope_weight: formData.scope,
        ...(projectId && { project_id: Number(projectId) }),
        ...(milestoneId && { milestone_id: Number(milestoneId) }),
        ...(formData.estimatedHours && { estimated_hours: Number(formData.estimatedHours) }),
        ...(formData.dueDate && { due_date: formData.dueDate }),
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
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to create task';
      toast.error(errorMessage);
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
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="e.g., 4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
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

      {/* Floating AI Assistant Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 right-8 w-72 p-4 bg-card border border-foreground rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground text-sm mb-1">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Describe the task and let AI fill in the details.
            </p>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Textarea
            placeholder='e.g., "Add playwright tests..."'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-background text-sm min-h-[60px] resize-none border-border focus-visible:ring-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            size="sm"
            className="w-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
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
      </motion.div>
    </div>
  );
}
