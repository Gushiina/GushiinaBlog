import express from 'express'
import cors from 'cors'
import { loadPosts, loadProfile, resolveAttachment } from './contentLoader.js'
import path from 'node:path'

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
  res.json(posts)
})

app.get('/api/attachment', async (req, res) => {
  const requested = String(req.query.path || '')
  const file = await resolveAttachment(requested, String(req.query.note || ''))
  if (file) return res.sendFile(file)
  if (!requested || requested.split(/[\\/]/).includes('..')) return res.status(400).end()
  // Earlier versions stored flattened attachments in the frontend public directory.
  return res.redirect('/ReferencePicture/' + encodeURIComponent(path.basename(requested.replace(/\\/g, '/'))))
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
