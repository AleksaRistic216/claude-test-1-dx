# GitHub Personal Access Token

## Generating a PAT

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens** (or classic tokens).
2. Click **Generate new token**.
3. Give it a name and set an expiration.
4. Select the scopes you need:
   - `repo` — read/write access to repositories (includes private repos)
   - `read:user` — read your public profile
   - `read:org` — read organisation membership (if needed)
   - `read:project` — read GitHub Projects (v2) data; needed for the project-data dropdown on the
     [Issues page](issues-page.md) (fine-grained tokens: grant org-level **Projects: Read-only** instead)
5. Click **Generate token** and copy it — GitHub only shows it once.

## Saving the PAT in gh-viewer

Open **Settings** (gear icon in the top-right navbar) and paste your token into the _GitHub Personal Access Token_ field, then click **Save**.

The token is stored in `localStorage` under the key `gh-viewer-settings` and never leaves the browser.

## Retrieving the PAT in code

Use the helpers in `src/utils/settings.js`:

```js
import { getSetting, loadSettings } from '@/utils/settings'

// Read just the PAT
const pat = getSetting('githubPat')   // string | null

// Read the full settings object
const { githubPat } = loadSettings()
```

### Passing the token to Axios

```js
import axios from 'axios'
import { getSetting } from '@/utils/settings'

const pat = getSetting('githubPat')

const response = await axios.get('https://api.github.com/user', {
  headers: pat ? { Authorization: `Bearer ${pat}` } : {}
})
```

For a shared Axios instance add the token as a default header at request time so it always picks up the latest saved value:

```js
// src/apis/mainApi.js
import axios from 'axios'
import { getSetting } from '@/utils/settings'

const mainApi = axios.create({ baseURL: 'http://localhost:5000' })

mainApi.interceptors.request.use(config => {
  const pat = getSetting('githubPat')
  if (pat) config.headers.Authorization = `Bearer ${pat}`
  return config
})

export default mainApi
```

See [`src/apis/githubApi.js`](../src/apis/githubApi.js) for a working instance of this pattern that talks to
`api.github.com` directly (used by the [Issues page](issues-page.md)).

## Notes

- The token is stored in plain text in `localStorage`. Do not use gh-viewer on shared or public machines.
- If a request returns `401 Unauthorized`, the token has likely expired or lacks the required scope — regenerate it and update the Settings page.
