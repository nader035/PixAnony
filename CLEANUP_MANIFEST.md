# PixAnony Cleanup Manifest

Created during the Figma Make direction refactor.

## Safety Notes

- Main source app: `pixanony-app`
- Visual reference only: `PixAnonyApp-FigmaMake`
- Data source rule: keep Supabase-backed pages and interactions; do not replace live screens with mock data.
- Existing git state before edits: dirty worktree with modified and untracked files.
- Existing lock note: `.git/index.lock` was present before edits, so git write operations are avoided.

## Generated Next.js Folders Approved For Cleanup

These folders are ignored by `.gitignore`, contain Next.js build/cache output, and are not source code:

- `.next`
- `.next-codex`
- `.next-codex-build2`
- `.next-codex-build3`
- `.next-codex-build4`
- `.next-codex-build5`
- `.next-codex-build6`
- `.next-codex-build7`
- `.next-codex-build8`
- `.next-codex-landing`
- `.next-codex-landing2`
- `.next-codex-landing3`
- `.next-codex-landing4`
- `.next-codex-verify`
- `.next-dev-codex2`
- `.next-fa-verify`
- `.next-production`
- `.next-ui-verify`
- `.next-ui-verify-dashboard`
- `.next-ui-verify-dashboard-2`
- `.next-ui-verify-final`
- `.next-ui-verify-final-2`

## Later Cleanup Candidates

These files/folders should be removed only after imports are replaced:

- `src/app/page.legacy.txt`
- `src/components/PixelBlast.jsx`
- `src/components/PixelBlast.css`
- `src/components/BorderGlow.jsx`
- `src/components/BorderGlow.css`
- `src/components/PixelCard.jsx`
- `src/components/PixelCard.css`
- `src/components/PixelTransition.jsx`
- `src/components/PixelTransition.css`
- `src/components/react-bits/pixel-blast.tsx`
- `src/components/react-bits/border-glow.tsx`
- unused old UI helpers under `src/components/ui`
- unused default assets in `public`
