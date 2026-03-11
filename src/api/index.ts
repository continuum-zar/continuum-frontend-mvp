export {
    fetchProjects,
    createProject,
    updateProject,
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
} from './tasks';
export type { Project, ProjectDetail, ProjectAPIResponse, Milestone, Member } from './projects';
export type { Task, TaskStatus, TaskAPIResponse, TaskTimelineEntry, TaskOption } from './tasks';
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
    useCreateTaskComment,
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
