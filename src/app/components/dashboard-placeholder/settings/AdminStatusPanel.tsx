"use client";

import { MOCK_ADMIN_SYSTEM_STATUS } from "@/lib/mock/adminSystemStatus";

import { Badge } from "../../ui/badge";

const { users, replicas } = MOCK_ADMIN_SYSTEM_STATUS;

const USER_STATS = [
  { label: "Total users", value: users.total },
  {
    label: "Active users",
    value: users.active,
    caption: "Signed in or active in the last 30 days",
  },
  { label: "Waitlisted users", value: users.waitlisted },
] as const;

function replicaStatusLabel(status: (typeof replicas)[number]["status"]) {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "outage":
      return "Outage";
  }
}

export function AdminStatusPanel() {
  return (
    <div className="flex flex-col gap-8 pt-6">
      <section className="flex flex-col gap-4" aria-labelledby="admin-status-users-heading">
        <h3
          id="admin-status-users-heading"
          className="font-['Satoshi',sans-serif] text-[16px] font-medium text-foreground"
        >
          User statistics
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {USER_STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-[8px] border border-border bg-background px-4 py-4"
            >
              <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="font-['Satoshi',sans-serif] text-[32px] font-medium leading-tight text-foreground">
                {stat.value.toLocaleString()}
              </p>
              {"caption" in stat && stat.caption ? (
                <p className="font-['Satoshi',sans-serif] text-[13px] font-normal leading-normal text-muted-foreground">
                  {stat.caption}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="admin-status-infra-heading">
        <h3
          id="admin-status-infra-heading"
          className="font-['Satoshi',sans-serif] text-[16px] font-medium text-foreground"
        >
          Infrastructure
        </h3>
        <ul className="flex flex-col overflow-hidden rounded-[8px] border border-border">
          {replicas.map((replica, index) => (
            <li
              key={replica.id}
              className={index > 0 ? "border-t border-border" : undefined}
            >
              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-[20px] leading-none" aria-hidden>
                    {replica.flag}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-foreground">
                      {replica.label}
                    </p>
                    <p className="font-['Satoshi',sans-serif] text-[14px] font-normal text-muted-foreground">
                      {replica.location}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="font-['Satoshi',sans-serif] text-[14px] font-medium tabular-nums text-foreground">
                    {replica.uptimePercent.toFixed(2)}% uptime
                  </p>
                  <Badge
                    variant={replica.status === "operational" ? "success" : "secondary"}
                  >
                    {replicaStatusLabel(replica.status)}
                  </Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
