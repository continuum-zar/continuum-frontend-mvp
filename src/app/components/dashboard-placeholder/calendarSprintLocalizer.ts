import type { Locale } from "date-fns";
import { dateFnsLocalizer } from "react-big-calendar";
import { format, getDay, startOfWeek as dfStartOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";

/** Shared react-big-calendar localizer (date-fns v3, Monday week start). */
export const sprintCalendarLocalizer = dateFnsLocalizer({
  format,
  startOfWeek: (date: Date, options?: { locale?: Locale }) =>
    dfStartOfWeek(date, { weekStartsOn: 1, locale: options?.locale ?? enUS }),
  getDay,
  locales: { "en-US": enUS },
});
