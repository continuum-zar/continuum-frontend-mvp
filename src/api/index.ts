export {
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    fetchProject,
    fetchMilestones,
    createMilestone,
    fetchMembers,
    addMember,
} from './projects';
export {
    fetchTask,
    updateTask,
    fetchProjectTasks,
    fetchAllTasks,
    updateTaskStatus,
    fetchTaskComments,
    createTaskComment,
    fetchTaskAttachments,
    uploadTaskAttachment,
    deleteAttachment,
    getAttachmentDownloadUrl,
    fetchTaskTimeline,
    assignTask,
    getTaskContext,
    getRelatedTasks,
    regenerateTaskSummary,
} from './tasks';
export type { Project, ProjectDetail, ProjectAPIResponse, Milestone, Member } from './projects';
export type {
    Task,
    TaskStatus,
    TaskAPIResponse,
    TaskTimelineEntry,
    TaskOption,
    TaskContextResponse,
    RelatedTasksResponse,
    RelatedTaskItem,
} from './tasks';
export {
    fetchRepositories,
    fetchRepositoryBranches,
    linkRepository,
    unlinkRepository,
    useProjectRepositories,
    useRepositoryBranches,
    useLinkRepository,
    useUnlinkRepository,
} from './repositories';
export type { Repository, RepositoryCreateBody, RepositoryProvider, BranchItem } from '@/types/repository';
export type { CommentAPIResponse } from '@/types/comment';
export { mapProjectListItem, mapProjectDetail, mapTask, mapMilestone, mapMember, mapMilestoneStatus, formatDueDate, mapAttachment } from './mappers';
export {
    useProjects,
    useProject,
    useProjectTasks,
    useAllTasks,
    useTask,
    useProjectMilestones,
    useProjectMembers,
    useCreateProject,
    useUpdateProject,
    useDeleteProject,
    useUpdateTaskStatus,
    useUpdateTask,
    useCreateMilestone,
    useAddMember,
    useTaskComments,
    useCreateTaskComment,
    useTaskAttachments,
    useUploadAttachment,
    useDeleteAttachment,
    useTaskTimeline,
    useAssignTask,
    projectKeys,
    getApiErrorMessage,
} from './hooks';
export type { AttachmentAPIResponse, Attachment } from '@/types/attachment';
export {
    fetchProjectDashboard,
    fetchProjectVelocityReport,
    fetchMilestoneBurndown,
    fetchUserRhythm,
    fetchProjectStaleWork,
    fetchClassificationBreakdown,
    fetchClientProjects,
    fetchClientProjectProgress,
    postProjectQuery,
    fetchProjectStats,
} from './dashboard';
export {
    fetchUserHours,
    fetchUserHoursByDay,
    getCurrentWeekRange,
    getCurrentMonthRange,
    getDaysElapsedInMonth,
    useUserHours,
    useUserHoursByDay,
    userHoursKeys,
} from './hours';
export type { UserHoursResponse, UserHoursByDayResponse, UserDailyHoursResponse, DailyHoursItem } from './hours';
export {
    fetchLoggedHours,
    createLoggedHour,
    downloadLoggedHoursCsv,
    fetchTasksForTimeLog,
} from './loggedHours';
export type { LoggedHourResponse, LoggedHourEntry, FetchLoggedHoursParams, CreateLoggedHourBody } from './loggedHours';
export {
    fetchActiveWorkSession,
    startWorkSession,
    pauseWorkSession,
    resumeWorkSession,
    stopWorkSession,
    suggestSessionDescription,
} from './workSessions';
export type {
    WorkSessionOut,
    WorkSessionStatus,
    ActiveWorkSessionResponse,
    WorkSessionCreateResponse,
    WorkSessionCreateBody,
    WorkSessionStopBody,
    SuggestDescriptionResponse,
} from './workSessions';
export {
    scanRepository,
    getWikiScanStatus,
    generateTasks,
    confirmTasks,
    useWikiScanStatus,
    useScanRepository,
} from './wiki';
export type {
    ScanStatusResponse,
    GenerateTasksResponse,
    GeneratedTask,
    WikiConfirmTaskItem,
    ConfirmTasksResponse,
} from './wiki';
export type {
    DashboardMetricsResponse,
    ProjectVelocityResponse,
    WeeklyVelocityData,
    MilestoneBurndownResponse,
    UserRhythmDayHourResponse,
    StaleWorkResponse,
    StaleBranchItem,
    ClassificationBreakdown,
    ClientPortalProgress,
    ClientProjectSummary,
    ClientHealthPie,
    ClientRecentActivityItem,
    ProjectQueryRequest,
    ProjectQueryResponse,
} from './dashboard';
export {
    fetchInvoices,
    fetchInvoice,
    downloadInvoice,
    generateInvoicePdf,
    generateInvoice,
    updateInvoiceStatus,
    useInvoices,
    invoiceKeys,
} from './invoices';
export type { InvoiceGenerate } from './invoices';
export {
    fetchClients,
    createClient,
    fetchClient,
    useClients,
    clientKeys,
} from './clients';
export type { Client, ClientAPIResponse, ClientCreate } from './clients';
export type { Invoice, InvoiceAPIResponse, InvoiceItem, InvoiceWithItems } from '@/types/invoice';
export { mapInvoice } from './mappers';
