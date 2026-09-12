/**
 * Vercel Configuration for SPA Routing
 * 
 * Note: Vercel reads `vercel.json` as its primary configuration file.
 * `vercel.json` has also been created alongside this file with the same rewrite rules.
 */
export default {
  rewrites: [
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
};
