import express from 'express'
import cors from 'cors'
import { loadPosts, loadProfile } from './contentLoader.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3001')

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/profile', async (req, res) => {
  const profile = await loadProfile()
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' })
  }
  res.json(profile)
})

app.get('/api/posts', async (req, res) => {
  const posts = await loadPosts()
  res.json(posts.map(p => ({ ...p, content: undefined })))
})

app.get('/api/posts/:id', async (req, res) => {
  const posts = await loadPosts()
  const post = posts.find(p => p.id === req.params.id)
  if (!post) {
    return res.status(404).json({ error: 'Post not found' })
  }
  res.json(post)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})
