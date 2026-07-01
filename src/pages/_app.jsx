import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '@/themes'
import NavBar from '@/components/NavBar'
import '@/styles/global.css'

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavBar />
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
