import { motion } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Skeleton } from "@/app/components/ui/skeleton";
import type { Member } from "@/types/member";

function getHeatmapColor(value: number) {
  if (value > 45) return "bg-primary";
  if (value > 30) return "bg-primary/80";
  if (value > 15) return "bg-primary/50";
  if (value > 0) return "bg-primary/20";
  return "bg-muted/30";
}

export type ProductivityRhythmHeatmapCardProps = {
  reduceMotion: boolean;
  effectiveRole: string;
  isProjectPM: boolean;
  hasProjectSelected: boolean;
  user: { id?: number | string } | null | undefined;
  rhythmMember: string;
  onRhythmMemberChange: (value: string) => void;
  rhythmProjectMembers: Member[];
  rhythmLoading: boolean;
  rhythmError: boolean;
  rhythmChartData: Record<string, string | number>[];
};

export function ProductivityRhythmHeatmapCard({
  reduceMotion,
  effectiveRole,
  isProjectPM,
  hasProjectSelected,
  user,
  rhythmMember,
  onRhythmMemberChange,
  rhythmProjectMembers,
  rhythmLoading,
  rhythmError,
  rhythmChartData,
}: ProductivityRhythmHeatmapCardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 mb-6" data-tour="productivity-rhythm-heatmap">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.2 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="mb-1">
              {effectiveRole === "Developer" ? "My Productivity Rhythm" : "Team Productivity Rhythm"}
            </h3>
            <p className="text-sm text-muted-foreground">Active minutes by hour block</p>
          </div>
          <div className="flex items-center gap-4">
            {isProjectPM && (
              <Select value={rhythmMember} onValueChange={onRhythmMemberChange}>
                <SelectTrigger className="w-[180px] h-8 text-xs border-border bg-card">
                  <SelectValue placeholder="Filter member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members (Collective)</SelectItem>
                  {rhythmProjectMembers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center text-xs space-x-2 text-muted-foreground">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-muted/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/20" />
              <div className="w-3 h-3 rounded-sm bg-primary/50" />
              <div className="w-3 h-3 rounded-sm bg-primary/80" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span>More</span>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex mb-2 ml-[40px]">
              {Array.from({ length: 11 }, (_, i) => i + 8).map((hour) => (
                <div key={hour} className="flex-1 text-center text-xs text-muted-foreground">
                  {hour}:00
                </div>
              ))}
            </div>

            {(effectiveRole === "Developer" && !user?.id) || (isProjectPM && !hasProjectSelected) ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                {isProjectPM ? "Select a project to view rhythm" : "Sign in to view your rhythm"}
              </div>
            ) : rhythmLoading ? (
              <div className="h-[200px] flex flex-col gap-1 ml-[40px]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-1 h-6">
                    {[...Array(11)].map((_, j) => (
                      <Skeleton key={j} className="flex-1 rounded-sm" />
                    ))}
                  </div>
                ))}
              </div>
            ) : rhythmError ? (
              <div className="h-[200px] flex items-center justify-center text-destructive text-sm">
                Failed to load rhythm
              </div>
            ) : isProjectPM && rhythmMember === "all" && rhythmProjectMembers.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No members in this project
              </div>
            ) : rhythmChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No rhythm data yet
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {rhythmChartData.map((dayRow, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-[40px] text-xs font-medium text-muted-foreground">{dayRow.day}</div>
                    <div className="flex-1 flex gap-1">
                      {Array.from({ length: 11 }, (_, i) => i + 8).map((hour) => (
                        <div
                          key={hour}
                          className={`flex-1 aspect-square rounded-sm ${getHeatmapColor(Number(dayRow[`hour${hour}`] ?? 0))}`}
                          title={`${dayRow.day} ${hour}:00 - ${dayRow[`hour${hour}`]} mins`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
