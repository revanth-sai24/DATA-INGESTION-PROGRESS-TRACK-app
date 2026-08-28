/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * The workspace is one page with the screen in the URL hash. There used to
   * be separate /tasks, /archived and /projects routes carrying an older copy
   * of those screens — unlinked, last touched in January, and quietly
   * diverging. They redirect here so any old bookmark lands on the real
   * screen. A client-side redirect could not do this: the root layout renders
   * the app on every route, so its own hash effect raced the redirect and won.
   */
  async redirects() {
    return ["tasks", "archived", "projects", "dashboard", "kanban", "calendar", "timeline"].map(
      (screen) => ({ source: `/${screen}`, destination: `/#/${screen}`, permanent: false }),
    );
  },
};

export default nextConfig;
