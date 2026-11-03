import { clientEnv } from "@/lib/env";

// Server side only: in the browser every backend call goes through the app/api/[...path] proxy instead.
export const BACKEND_ORIGIN = clientEnv.NEXT_PUBLIC_API_URL;
