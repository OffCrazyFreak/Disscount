import axios from "axios";

import { pageLanguageHeaders } from "@/lib/api/page-language-headers";

// The browser's client for our own /api/cijene routes; the upstream token stays on the server.
const cijeneRouteClient = axios.create();

cijeneRouteClient.interceptors.request.use((config) => {
  config.headers.set(pageLanguageHeaders());
  return config;
});

export default cijeneRouteClient;
