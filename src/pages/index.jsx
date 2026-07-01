import { Box, Typography, Container } from '@mui/material'

export default function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          GitHub Viewer
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Getting started...
        </Typography>
      </Box>
    </Container>
  )
}
