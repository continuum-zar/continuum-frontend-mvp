export {
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    fetchProject,
    fetchMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    fetchMembers,
    addMember,
    fetchProjectAttachments,
    uploadProjectAttachment,
    addProjectAttachmentLink,
    deleteProjectAttachment,
    getProjectAttachmentDownloadUrl,
} from './projects';
export {
    fetchTask,
    updateTask,
    deleteTask,
    fetchProjectTasks,
    fetchAllTasks,
    updateTaskStatus,
    fetchTaskComments,
    createTaskComment,
    fetchTaskAttachments,
    uploadTaskAttachment,
    addTaskAttachmentLink,
    deleteAttachment,
    getAttachmentDownloadUrl,
    downloadTaskAttachment,
    fetchTaskTimeline,
    assignTask,
    getTaskContext,
    getRelatedTasks,
    regenerateTaskSummary,
    addTaskLabel,
    removeTaskLabel,
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
export { mapProjectListItem, mapProjectDetail, mapTask, mapMilestone, mapMember, mapMilestoneStatus, formatDueDate, mapAttachment, normalizeProjectStatus } from './mappers';
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
    useUpdateMilestone,
    useDeleteMilestone,
    useAddMember,
    useTaskComments,
    useCreateTaskComment,
    useTaskAttachments,
    useUploadAttachment,
    useAddAttachmentLink,
    useDeleteAttachment,
    useProjectAttachments,
    useUploadProjectAttachment,
    useAddProjectAttachmentLink,
    useDeleteProjectAttachment,
    useTaskTimeline,
    useAssignTask,
    useDeleteTask,
    useAddTaskLabel,
    useRemoveTaskLabel,
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
export { checkEmailExists, postWaitlistSignup } from './auth';
export type { EmailExistsResponse, WaitlistSignupResponse } from './auth';
export type { Client, ClientAPIResponse, ClientCreate } from './clients';
export type { Invoice, InvoiceAPIResponse, InvoiceItem, InvoiceWithItems } from '@/types/invoice';
export { mapInvoice } from './mappers';
export {
    uploadPlannerFile,
    sendPlannerChat,
    generatePlan,
    approvePlan,
    useUploadPlannerFile,
    usePlannerChat,
    useGeneratePlan,
    useApprovePlan,
} from './planner';
export type {
    PlannerMessage,
    FileContent,
    PlannerChatResponse,
    PlannedTask,
    PlannedMilestone,
    ProjectPlan,
    GeneratePlanResponse,
    ApprovePlanResponse,
} from './planner';
export {
    fetchProjectIntegrations,
    createProjectIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    integrationKeys,
} from './integrations';
export type { Integration, IntegrationCreate, IntegrationUpdate, IntegrationProvider } from '@/types/integration';
export {
    useProjectIntegrations,
    useCreateIntegration,
    useUpdateIntegration,
    useDeleteIntegration,
    useTestIntegration,
} from './hooks';
