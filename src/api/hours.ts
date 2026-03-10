import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/** GET /api/v1/users/me/hours - total hours in range (total_hours in minutes). */
export interface UserHoursResponse {
    total_hours: number;
}

/** GET /api/v1/users/me/hours/by-day - hours broken down by day. */
export interface DailyHoursItem {
    date: string;
    hours: number;
}

export interface UserHoursByDayResponse {
    total_hours?: number;
    daily_hours?: DailyHoursItem[];
}

export async function fetchUserHours(startDate: string, endDate: string): Promise<UserHoursResponse> {
    const { data } = await api.get<UserHoursResponse>('/users/me/hours', {
        params: { start_date: startDate, end_date: endDate },
    });
    return data;
}

export async function fetchUserHoursByDay(startDate: string, endDate: string): Promise<UserHoursByDayResponse> {
    const { data } = await api.get<UserHoursByDayResponse>('/users/me/hours/by-day', {
        params: { start_date: startDate, end_date: endDate },
    });
    return data ?? {};
}

/** Current week Monday 00:00 to Sunday 23:59 in local time (ISO date strings for API). */
export function getCurrentWeekRange(): { start: string; end: string } {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return {
        start: monday.toISOString().slice(0, 10),
        end: sunday.toISOString().slice(0, 10),
    };
}

/** First and last day of current month (local) as ISO date strings. */
export function getCurrentMonthRange(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
    };
}

/** Number of days elapsed in the current month (1-based). */
export function getDaysElapsedInMonth(): number {
    const now = new Date();
    return now.getDate();
}

export const userHoursKeys = {
    all: ['users', 'me', 'hours'] as const,
    range: (start: string, end: string) => [...userHoursKeys.all, start, end] as const,
    byDay: (start: string, end: string) => [...userHoursKeys.all, 'by-day', start, end] as const,
};

export function useUserHours(startDate: string, endDate: string) {
    return useQuery({
        queryKey: userHoursKeys.range(startDate, endDate),
        queryFn: () => fetchUserHours(startDate, endDate),
        enabled: Boolean(startDate && endDate),
    });
}

export function useUserHoursByDay(startDate: string, endDate: string) {
    return useQuery({
        queryKey: userHoursKeys.byDay(startDate, endDate),
        queryFn: () => fetchUserHoursByDay(startDate, endDate),
        enabled: Boolean(startDate && endDate),
    });
}
