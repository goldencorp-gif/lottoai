
// This file is deprecated for Netlify deployments.
// Logic has been moved to netlify/functions/generate.ts
// This file is kept as a placeholder to prevent build errors if referenced elsewhere by mistake.

export default function handler() {
  return new Response("Please use /.netlify/functions/generate", { status: 404 });
}
