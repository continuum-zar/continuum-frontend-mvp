export {
    fetchProjects,
    createProject,
    updateProject,
    fetchProject,
    fetchProjectTasks,
    fetchAllTasks,
    updateTaskStatus,
    fetchMilestones,
    createMilestone,
    fetchMembers,
    addMember,
} from './projects';
export type { Project, ProjectDetail, ProjectAPIResponse, Task, TaskStatus, TaskOption, Milestone, Member } from './projects';
export { mapProjectListItem, mapProjectDetail, mapTask, mapMilestone, mapMember, mapMilestoneStatus, formatDueDate } from './mappers';
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
    useCreateMilestone,
    useAddMember,
    projectKeys,
} from './hooks';
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
export type { UserHoursResponse, UserHoursByDayResponse, DailyHoursItem } from './hours';
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
