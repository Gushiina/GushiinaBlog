export interface Post {
  id: string
  title: string
  date: string
  tags: string[]
  wordCount: number
  content: string
  excerpt: string
}

export interface Profile {
  nickname: string
  avatar: string
  bio: string
  social: {
    github: string
    bilibili: string
    steam: string
    email: string
  }
  blog: {
    title: string
    description: string
    footer: string
  }
}
