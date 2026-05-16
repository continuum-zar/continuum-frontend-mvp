export type ReplicaStatus = "operational" | "degraded" | "outage";

export type AdminSystemStatusReplica = {
  id: string;
  label: string;
  location: string;
  flag: string;
  uptimePercent: number;
  status: ReplicaStatus;
};

export type AdminSystemStatusUsers = {
  total: number;
  active: number;
  waitlisted: number;
};

export type AdminSystemStatus = {
  users: AdminSystemStatusUsers;
  replicas: AdminSystemStatusReplica[];
};

/** Mock data for admin system status until GET /admin/system-status exists. */
export const MOCK_ADMIN_SYSTEM_STATUS: AdminSystemStatus = {
  users: {
    total: 654,
    active: 421,
    waitlisted: 233,
  },
  replicas: [
    {
      id: "ap-southeast",
      label: "Southeast Asia",
      location: "Singapore, Singapore",
      flag: "🇸🇬",
      uptimePercent: 99.98,
      status: "operational",
    },
    {
      id: "us-west",
      label: "US West",
      location: "California, USA",
      flag: "🇺🇸",
      uptimePercent: 99.97,
      status: "operational",
    },
    {
      id: "us-east",
      label: "US East",
      location: "Virginia, USA",
      flag: "🇺🇸",
      uptimePercent: 99.99,
      status: "operational",
    },
    {
      id: "eu-west",
      label: "EU West",
      location: "Amsterdam, Netherlands",
      flag: "🇳🇱",
      uptimePercent: 99.96,
      status: "operational",
    },
  ],
};
