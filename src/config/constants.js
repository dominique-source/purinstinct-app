export const PROD_URL="https://purinstinct-app.vercel.app";

export const BASE_URL=window.location.hostname==="localhost"?PROD_URL:window.location.origin;
