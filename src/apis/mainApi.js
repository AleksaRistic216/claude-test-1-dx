import axios from 'axios'

const mainApi = axios.create({
  baseURL: '/api'
})

export default mainApi
