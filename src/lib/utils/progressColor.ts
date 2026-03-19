/**
 * Returns a Tailwind background color class based on progress percentage.
 * 
 * @param progress - Progress value from 0 to 100
 * @returns Tailwind CSS class for background color
 */
export const getProgressColor = (progress: number): string => {
    if (progress < 40) return "bg-red-500";
    if (progress < 75) return "bg-blue-500";
    return "bg-green-500";
};
