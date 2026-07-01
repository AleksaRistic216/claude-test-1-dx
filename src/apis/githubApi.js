import axios from 'axios'
import { getSetting } from '@/utils/settings'

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
})

githubApi.interceptors.request.use(config => {
  const pat = getSetting('githubPat')
  if (pat) {
    config.headers.Authorization = `Bearer ${pat}`
  }
  return config
})

export default githubApi
