import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://proper-peccary-781.convex.cloud";

export const convex = new ConvexReactClient(convexUrl);
export const convexHttp = new ConvexHttpClient(convexUrl);
