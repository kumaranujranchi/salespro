import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Pull leads from property portals (99acres and Magicbricks) every 15 minutes
crons.interval(
  "pull-property-portal-leads",
  { minutes: 15 },
  internal.portals.pullPortalLeads,
);

export default crons;
