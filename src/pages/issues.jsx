import { useEffect, useState, Fragment } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Link from '@mui/material/Link'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import NextLink from 'next/link'
import githubApi, { githubGraphql } from '@/apis/githubApi'
import { getSetting } from '@/utils/settings'

const OWNER = 'DevExpress'
const REPO = 'dxvcs'
const SEARCH_RESULT_CAP = 1000

const PROJECT_ITEMS_QUERY = `
  query IssueProjectItems($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Issue {
        id
        projectItems(first: 20) {
          nodes {
            project {
              title
              number
              url
            }
            fieldValues(first: 50) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldNumberValue {
                  number
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldDateValue {
                  date
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldIterationValue {
                  title
                  startDate
                  duration
                  field { ... on ProjectV2FieldCommon { name } }
                }
              }
            }
          }
        }
      }
    }
  }
`

const PER_PAGE_OPTIONS = [10, 25, 50, 100]
const SORT_OPTIONS = [
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'comments', label: 'Comments' }
]

export default function IssuesPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [state, setState] = useState('open')
  const [sort, setSort] = useState('created')
  const [direction, setDirection] = useState('desc')

  const [issues, setIssues] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasPat, setHasPat] = useState(true)

  const [projectsByIssue, setProjectsByIssue] = useState({})
  const [projectsError, setProjectsError] = useState(null)
  const [expandedIssues, setExpandedIssues] = useState(new Set())

  useEffect(() => {
    setHasPat(Boolean(getSetting('githubPat')))
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchIssues() {
      setLoading(true)
      setError(null)
      try {
        const qualifiers = [`repo:${OWNER}/${REPO}`, 'type:issue']
        if (state !== 'all') qualifiers.push(`state:${state}`)

        const { data } = await githubApi.get('/search/issues', {
          signal: controller.signal,
          params: {
            q: qualifiers.join(' '),
            sort,
            order: direction,
            page,
            per_page: perPage
          }
        })

        setIssues(data.items)
        setTotalCount(data.total_count)
      } catch (err) {
        if (axiosCancelled(err)) return
        setError(err.response?.data?.message || 'Failed to load issues from GitHub.')
        setIssues([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchIssues()
    return () => controller.abort()
  }, [page, perPage, state, sort, direction])

  useEffect(() => {
    if (!hasPat || issues.length === 0) {
      setProjectsByIssue({})
      return
    }

    const controller = new AbortController()

    async function fetchProjectItems() {
      setProjectsError(null)
      try {
        const data = await githubGraphql(
          PROJECT_ITEMS_QUERY,
          { ids: issues.map(issue => issue.node_id) },
          controller.signal
        )

        const byIssue = {}
        for (const node of data.nodes) {
          if (!node?.projectItems) continue
          byIssue[node.id] = node.projectItems.nodes.map(item => ({
            project: item.project,
            fields: item.fieldValues.nodes
              .filter(v => v.field?.name)
              .map(v => ({ name: v.field.name, value: formatFieldValue(v) }))
          }))
        }
        setProjectsByIssue(byIssue)
      } catch (err) {
        if (axiosCancelled(err)) return
        setProjectsError('Failed to load project data from GitHub (check that your PAT has project read access).')
        setProjectsByIssue({})
      }
    }

    fetchProjectItems()
    return () => controller.abort()
  }, [issues, hasPat])

  function toggleExpanded(id) {
    setExpandedIssues(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const cappedTotal = Math.min(totalCount, SEARCH_RESULT_CAP)
  const pageCount = Math.max(1, Math.ceil(cappedTotal / perPage))

  function handleSortClick(field) {
    if (sort === field) {
      setDirection(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setDirection('desc')
    }
    setPage(1)
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Issues
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {OWNER}/{REPO} &mdash;{' '}
          <Link href={`https://github.com/${OWNER}/${REPO}`} target="_blank" rel="noopener noreferrer">
            view on GitHub
          </Link>
        </Typography>

        {!hasPat && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No GitHub personal access token is set. Requests are unauthenticated and subject to
            stricter rate limits. Set one on the{' '}
            <NextLink href="/settings" passHref legacyBehavior>
              <Link>Settings</Link>
            </NextLink>{' '}
            page.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {projectsError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {projectsError}
          </Alert>
        )}

        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="state-label">State</InputLabel>
            <Select
              labelId="state-label"
              label="State"
              value={state}
              onChange={e => {
                setState(e.target.value)
                setPage(1)
              }}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
              <MenuItem value="all">All</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="sort-label">Sort by</InputLabel>
            <Select
              labelId="sort-label"
              label="Sort by"
              value={sort}
              onChange={e => {
                setSort(e.target.value)
                setPage(1)
              }}
            >
              {SORT_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="direction-label">Direction</InputLabel>
            <Select
              labelId="direction-label"
              label="Direction"
              value={direction}
              onChange={e => {
                setDirection(e.target.value)
                setPage(1)
              }}
            >
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="per-page-label">Per page</InputLabel>
            <Select
              labelId="per-page-label"
              label="Per page"
              value={perPage}
              onChange={e => {
                setPerPage(e.target.value)
                setPage(1)
              }}
            >
              {PER_PAGE_OPTIONS.map(n => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell width={80}>#</TableCell>
                <TableCell>Title</TableCell>
                <TableCell width={100}>State</TableCell>
                <TableCell width={160}>Author</TableCell>
                <TableCell width={110} sortDirection={sort === 'comments' ? direction : false}>
                  <TableSortLabel
                    active={sort === 'comments'}
                    direction={sort === 'comments' ? direction : 'desc'}
                    onClick={() => handleSortClick('comments')}
                  >
                    Comments
                  </TableSortLabel>
                </TableCell>
                <TableCell width={140} sortDirection={sort === 'created' ? direction : false}>
                  <TableSortLabel
                    active={sort === 'created'}
                    direction={sort === 'created' ? direction : 'desc'}
                    onClick={() => handleSortClick('created')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell width={140} sortDirection={sort === 'updated' ? direction : false}>
                  <TableSortLabel
                    active={sort === 'updated'}
                    direction={sort === 'updated' ? direction : 'desc'}
                    onClick={() => handleSortClick('updated')}
                  >
                    Updated
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    No issues found.
                  </TableCell>
                </TableRow>
              ) : (
                issues.map(issue => {
                  const projectItems = projectsByIssue[issue.node_id] || []
                  const hasProjects = projectItems.length > 0
                  const expanded = expandedIssues.has(issue.id)

                  return (
                    <Fragment key={issue.id}>
                      <TableRow hover>
                        <TableCell>
                          {hasProjects && (
                            <IconButton size="small" onClick={() => toggleExpanded(issue.id)}>
                              <ExpandMoreIcon
                                fontSize="small"
                                sx={{
                                  transform: expanded ? 'rotate(180deg)' : 'none',
                                  transition: 'transform 0.15s'
                                }}
                              />
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={issue.html_url} target="_blank" rel="noopener noreferrer">
                            #{issue.number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={issue.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="inherit"
                            underline="hover"
                          >
                            {issue.title}
                          </Link>
                          {issue.labels?.length > 0 && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                              {issue.labels.map(label => (
                                <Chip
                                  key={label.id}
                                  label={label.name}
                                  size="small"
                                  sx={{
                                    bgcolor: `#${label.color}`,
                                    color: isLightColor(label.color) ? '#000' : '#fff',
                                    height: 20,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={issue.state}
                            size="small"
                            color={issue.state === 'open' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar src={issue.user?.avatar_url} sx={{ width: 20, height: 20 }} />
                            <Typography variant="body2" noWrap>
                              {issue.user?.login}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{issue.comments}</TableCell>
                        <TableCell>{formatDate(issue.created_at)}</TableCell>
                        <TableCell>{formatDate(issue.updated_at)}</TableCell>
                      </TableRow>
                      {hasProjects && (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ py: 0, borderBottom: expanded ? undefined : 'none' }}>
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <Box sx={{ py: 2, px: 2 }}>
                                {projectItems.map((item, idx) => (
                                  <Box key={item.project.url} sx={{ mb: idx < projectItems.length - 1 ? 2 : 0 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      <Link href={item.project.url} target="_blank" rel="noopener noreferrer">
                                        {item.project.title}
                                      </Link>
                                    </Typography>
                                    {item.fields.length > 0 ? (
                                      <Table size="small">
                                        <TableBody>
                                          {item.fields.map(field => (
                                            <TableRow key={field.name}>
                                              <TableCell sx={{ border: 0, fontWeight: 500, width: 160, py: 0.5 }}>
                                                {field.name}
                                              </TableCell>
                                              <TableCell sx={{ border: 0, py: 0.5 }}>{field.value}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        No field data set.
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }} flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">
            {totalCount > SEARCH_RESULT_CAP
              ? `Showing up to ${SEARCH_RESULT_CAP} of ${totalCount} issues (GitHub search API limit).`
              : `${totalCount} issue${totalCount === 1 ? '' : 's'}`}
          </Typography>
          <Pagination
            page={page}
            count={pageCount}
            onChange={(_, value) => setPage(value)}
            color="primary"
            disabled={loading}
          />
        </Stack>
      </Box>
    </Container>
  )
}

function axiosCancelled(err) {
  return err.code === 'ERR_CANCELED' || err.name === 'CanceledError'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatFieldDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatFieldValue(v) {
  switch (v.__typename) {
    case 'ProjectV2ItemFieldTextValue':
      return v.text
    case 'ProjectV2ItemFieldNumberValue':
      return v.number
    case 'ProjectV2ItemFieldDateValue':
      return formatFieldDate(v.date)
    case 'ProjectV2ItemFieldSingleSelectValue':
      return v.name
    case 'ProjectV2ItemFieldIterationValue':
      return `${v.title} (starts ${formatFieldDate(v.startDate)}, ${v.duration}d)`
    default:
      return null
  }
}

function isLightColor(hex) {
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}
