import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://placeholder.convex.cloud";

export const convex = new ConvexReactClient(convexUrl);
export const convexHttp = new ConvexHttpClient(convexUrl);
