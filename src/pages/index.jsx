import { Box, Typography, Container, Button } from '@mui/material'
import NextLink from 'next/link'

export default function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          GitHub Viewer
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Getting started...
        </Typography>
        <NextLink href="/issues" passHref legacyBehavior>
          <Button variant="contained" disableElevation>
            View Issues
          </Button>
        </NextLink>
      </Box>
    </Container>
  )
}
