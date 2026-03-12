export {
    fetchProjects,
    createProject,
    updateProject,
    fetchProject,
    fetchProjectTasks,
    fetchAllTasks,
    updateTaskStatus,
    updateTask,
    fetchTask,
    fetchMilestones,
    createMilestone,
    fetchMembers,
    addMember,
    fetchTaskComments,
    postTaskComment, fetchTaskAttachments, uploadTaskAttachment, deleteAttachment, getAttachmentDownloadUrl,
    fetchTaskTimeline,
    assignTask,
} from './projects';
export type { Project, ProjectDetail, ProjectAPIResponse, Task, TaskStatus, TaskOption, Milestone, Member, TaskTimelineEntry } from './projects';
export type { CommentAPIResponse } from '@/types/comment';
export { mapProjectListItem, mapProjectDetail, mapTask, mapMilestone, mapMember, mapMilestoneStatus, formatDueDate, mapAttachment } from './mappers';
export {
    useProjects,
    useProject,
    useProjectTasks,
    useAllTasks,
    useProjectMilestones,
    useProjectMembers,
    useCreateProject,
    useUpdateProject,
    useUpdateTaskStatus,
    useUpdateTask,
    useCreateMilestone,
    useAddMember,
    useTaskComments,
    usePostComment,
    useTaskAttachments,
    useUploadAttachment,
    useDeleteAttachment,
    useTaskTimeline,
    useAssignTask,
    projectKeys,
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
} from './workSessions';
export type {
    WorkSessionOut,
    WorkSessionStatus,
    ActiveWorkSessionResponse,
    WorkSessionCreateResponse,
    WorkSessionCreateBody,
    WorkSessionStopBody,
} from './workSessions';
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
    downloadInvoicePdf,
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
