# Issues page

`/issues` lists issues from [DevExpress/dxvcs](https://github.com/DevExpress/dxvcs), fetched directly from the browser
using [`src/apis/githubApi.js`](../src/apis/githubApi.js) and the GitHub PAT from [Settings](github-pat.md).

## Why the Search API instead of the REST issues endpoint

The page calls `GET /search/issues` (not `GET /repos/{owner}/{repo}/issues`) because it:

- returns `total_count`, so the UI can show a real page count instead of guessing from `Link` headers
- supports a `type:issue` query qualifier, which excludes pull requests — the plain issues endpoint returns both
  and has no server-side way to filter them out

The repo, state, sort field, and sort direction are all sent as request params/qualifiers (`q`, `sort`, `order`,
`page`, `per_page`), so each page change or sort change fetches exactly one page from GitHub — the client never
downloads the full issue list.

Caveats:

- The Search API caps results at **1000** regardless of `total_count`. For repos with more open+closed issues than
  that, the last pages become unreachable; the page footer shows a note when this happens.
- The Search API has a lower rate limit than the core REST API (30 req/min authenticated, 10 req/min
  unauthenticated), so a PAT matters more here than for other endpoints — see [github-pat.md](github-pat.md).

## Project data (GitHub Projects v2)

Each row can expand into a dropdown showing every GitHub Project (v2) the issue belongs to, along with that
project's custom field values (status, iteration, text/number/date fields, etc.) — see
[dxvcs-github-projects.md](dxvcs-github-projects.md) for what fields dxvcs's projects actually define.

GitHub's REST API has no endpoint for Projects v2 item field values, so this part of the page uses the GraphQL
API instead, via the `githubGraphql` helper in [`src/apis/githubApi.js`](../src/apis/githubApi.js). After a page
of issues loads, one GraphQL request fetches project data for every issue on that page at once (`nodes(ids:
[...])`), so the cost stays at one extra request per page regardless of `per_page` — not one request per issue.

The expand arrow only appears on issues that belong to at least one project. Field values are rendered
generically per project, since each project defines its own set of custom fields.

Requires a PAT with project read access (classic PAT: `read:project` scope; fine-grained PAT: org-level
**Projects: Read-only** permission) — see [github-pat.md](github-pat.md). Without it, or if the GraphQL request
fails, the dropdowns are simply omitted and a dismissible warning is shown instead of blocking the issue list.

## Changing the target repo

`OWNER` and `REPO` are constants at the top of `src/pages/issues.jsx`. There's no repo picker UI; this page is
scoped to a single hardcoded repo by design.
