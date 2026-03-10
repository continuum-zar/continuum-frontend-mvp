import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import {
  ArrowLeft,
  Calendar,
  User,
  Paperclip,
  MoreVertical,
  Send,
  CheckCircle2,
  Clock,
  Tag
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';

const comments = [
  {
    id: 1,
    user: 'Sarah Chen',
    avatar: 'SC',
    content: 'I\'ve started working on the initial mockups. Will have something to share by EOD.',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    user: 'Emma Wilson',
    avatar: 'EW',
    content: 'Great! Make sure to follow the design system we established in Figma.',
    timestamp: '1 hour ago',
  },
  {
    id: 3,
    user: 'Sarah Chen',
    avatar: 'SC',
    content: 'Absolutely. I\'m using the component library as reference.',
    timestamp: '45 minutes ago',
  },
];

const attachments = [
  { id: 1, name: 'landing-page-mockup-v1.fig', size: '2.4 MB', type: 'figma' },
  { id: 2, name: 'design-specs.pdf', size: '892 KB', type: 'pdf' },
  { id: 3, name: 'brand-guidelines.pdf', size: '1.2 MB', type: 'pdf' },
];

const activityLog = [
  { id: 1, user: 'Sarah Chen', action: 'changed status from', from: 'To Do', to: 'In Progress', time: '3 hours ago' },
  { id: 2, user: 'Emma Wilson', action: 'added attachment', detail: 'design-specs.pdf', time: '5 hours ago' },
  { id: 3, user: 'Sarah Chen', action: 'was assigned to this task', time: '1 day ago' },
  { id: 4, user: 'Mike Torres', action: 'created this task', time: '2 days ago' },
];

export function TaskDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { projectId?: string | number } | undefined) || {};
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('in-progress');
  const [scope, setScope] = useState('L');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      // Handle comment submission
      setComment('');
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Button
            variant="ghost"
            onClick={() => (state.projectId ? navigate(`/projects/${state.projectId}`) : navigate(-1))}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Board
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Task Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl mb-2">Design new landing page</h1>
                  <p className="text-muted-foreground">
                    Create mockups for the new marketing site based on the updated brand guidelines
                  </p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <Badge variant="secondary">Mobile App Redesign</Badge>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">TASK-1247</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <h3 className="mb-3">Description</h3>
              <div className="text-muted-foreground space-y-2">
                <p>
                  We need to design a new landing page that showcases our updated product features
                  and aligns with our refreshed brand identity.
                </p>
              </div>
            </div>

            {/* Checklists */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <h3 className="mb-4">Checklist</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded border border-primary bg-primary flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground line-through">Review competitor landing pages</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded border border-border flex items-center justify-center flex-shrink-0" />
                  <span className="text-sm">Create wireframes for desktop & mobile</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded border border-border flex items-center justify-center flex-shrink-0" />
                  <span className="text-sm">Design high-fidelity mockups</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded border border-border flex items-center justify-center flex-shrink-0" />
                  <span className="text-sm">Get approval from marketing team</span>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3>Attachments</h3>
                <Button variant="outline" size="sm">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add File
                </Button>
              </div>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                        <Paperclip className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">{attachment.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <h3 className="mb-6">Comments</h3>
              <div className="space-y-6 mb-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{comment.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{comment.user}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <form onSubmit={handleSubmitComment} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mb-2 bg-input-background"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={!comment.trim()}>
                      <Send className="mr-2 h-4 w-4" />
                      Comment
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Activity Log */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="mb-4">Activity</h3>
              <div className="space-y-4">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p>
                        <span className="font-medium">{activity.user}</span>{' '}
                        <span className="text-muted-foreground">{activity.action}</span>
                        {activity.from && (
                          <>
                            {' '}<Badge variant="outline" className="mx-1">{activity.from}</Badge>
                            {' to '}
                            <Badge variant="outline" className="ml-1">{activity.to}</Badge>
                          </>
                        )}
                        {activity.detail && (
                          <span className="font-medium ml-1">{activity.detail}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-80 bg-card border-l border-border p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="space-y-6"
        >
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Scope</label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue />
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

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <User className="h-4 w-4 mr-2" />
              Assignees
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Sarah Chen</p>
                  <p className="text-xs text-muted-foreground">Designer</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>EW</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Emma Wilson</p>
                  <p className="text-xs text-muted-foreground">Design Lead</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Add Assignee
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <Calendar className="h-4 w-4 mr-2" />
              Dates
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>Feb 19, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>Feb 21, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due date</span>
                <span className="text-warning">Feb 25, 2026</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <Tag className="h-4 w-4 mr-2" />
              Labels
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Design</Badge>
              <Badge variant="secondary">Frontend</Badge>
              <Badge variant="secondary">Marketing</Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Add Label
            </Button>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <Clock className="h-4 w-4 mr-2" />
              Time Tracking
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated</span>
                <span>8 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logged</span>
                <span>4.5 hours</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Log Time
            </Button>
          </div>
        </motion.div>
      </aside>
    </div>
  );
}
