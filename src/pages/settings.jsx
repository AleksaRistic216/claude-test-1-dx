import { useState, useEffect } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { loadSettings, saveSettings } from '@/utils/settings'

export default function SettingsPage() {
  const [pat, setPat] = useState('')
  const [showPat, setShowPat] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = loadSettings()
    if (s.githubPat) setPat(s.githubPat)
  }, [])

  function handleSave(e) {
    e.preventDefault()
    const current = loadSettings()
    saveSettings({ ...current, githubPat: pat.trim() })
    setSaved(true)
  }

  function handleClear() {
    setPat('')
    const current = loadSettings()
    const { githubPat: _, ...rest } = current
    saveSettings(rest)
    setSaved(true)
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Stored locally in your browser. Never sent to any server.
        </Typography>

        <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="GitHub Personal Access Token"
            value={pat}
            onChange={e => setPat(e.target.value)}
            type={showPat ? 'text' : 'password'}
            fullWidth
            placeholder="ghp_..."
            helperText="Required for authenticated API requests and private repos."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPat(v => !v)} edge="end">
                    {showPat ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained" disableElevation>
              Save
            </Button>
            <Button type="button" variant="outlined" color="error" onClick={handleClear}>
              Clear
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSaved(false)} sx={{ width: '100%' }}>
          Settings saved.
        </Alert>
      </Snackbar>
    </Container>
  )
}
