# Deployment

Current is prepared as a static single-page Vue application for Cloudflare Pages Git deployment.

## Cloudflare Pages settings

- Git provider: GitHub
- Suggested repository: `basykcode/current-flow`
- Production branch: `master`
- Framework preset: Vue (or None)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Environment variable if the build image does not honor `package.json`: `NODE_VERSION=22.18.0`

Vite uses `/` as its base. There is deliberately no top-level `404.html`, Netlify configuration, redirect file, Worker, Function, or Wrangler configuration. Cloudflare Pages can apply its SPA fallback behavior when no top-level `404.html` exists.

Connect the GitHub repository in **Workers & Pages → Create application → Pages → Connect to Git**. Every push to `master` will then trigger a production build.

## Custom apex domain

In the Pages project, open **Custom domains → Set up a custom domain**, enter the apex domain, and follow Cloudflare's DNS confirmation. The placeholder `https://current-flow.net` currently appears in `index.html`, `public/robots.txt`, and `public/sitemap.xml`; change those values after the canonical production domain is confirmed.

Do not place secrets in Vite environment variables: values bundled into a static frontend are public.

## First remote push

If the repository has no remote, create an empty GitHub repository and run:

```bash
git remote add origin https://github.com/basykcode/current-flow.git
git push -u origin master
```
