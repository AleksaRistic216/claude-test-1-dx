import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import SettingsIcon from '@mui/icons-material/Settings'
import CodeIcon from '@mui/icons-material/Code'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function NavBar() {
  const router = useRouter()

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Link href="/" passHref legacyBehavior>
          <IconButton color="inherit" edge="start" sx={{ mr: 1 }}>
            <CodeIcon />
          </IconButton>
        </Link>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          GitHub Viewer
        </Typography>
        <Link href="/settings" passHref legacyBehavior>
          <IconButton
            color="inherit"
            aria-label="settings"
            sx={{ opacity: router.pathname === '/settings' ? 1 : 0.75 }}
          >
            <SettingsIcon />
          </IconButton>
        </Link>
      </Toolbar>
    </AppBar>
  )
}
