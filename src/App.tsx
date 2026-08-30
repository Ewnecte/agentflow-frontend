import { useCallback, useEffect, useRef, useState } from 'react'
import { App as AntdApp, Layout } from 'antd'
import ChatWindow from './components/ChatWindow'
import Sidebar from './components/Sidebar'
import {
  deleteConversation,
  getConversation,
  listConversations,
  renameConversation,
  sendMessage,
} from './api'
import type { ChatMessage, ConversationSummary } from './types'
import './App.css'

function App() {
  const { message } = AntdApp.useApp()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await listConversations())
    } catch {
      message.error('加载会话列表失败')
    }
  }, [message])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const selectConversation = useCallback(
    async (id: number) => {
      if (streaming || id === currentId) return
      try {
        const detail = await getConversation(id)
        setCurrentId(id)
        setMessages(detail.messages)
      } catch {
        message.error('加载会话失败')
      }
    },
    [streaming, currentId, message],
  )

  const newChat = useCallback(() => {
    if (streaming) return
    setCurrentId(null)
    setMessages([])
  }, [streaming])

  const handleSend = useCallback(
    async (content: string) => {
      if (streaming) return
      const now = new Date().toISOString()
      const userMsg: ChatMessage = { id: Date.now(), role: 'user', content, created_at: now }
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        created_at: now,
        pending: true,
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      const appendToken = (text: string) => {
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          next[next.length - 1] = { ...last, content: last.content + text }
          return next
        })
      }

      const finish = (finalContent?: string) => {
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          next[next.length - 1] = {
            ...last,
            content: finalContent ?? last.content,
            pending: false,
          }
          return next
        })
        setStreaming(false)
      }

      try {
        await sendMessage(
          content,
          currentId,
          {
            onToken: appendToken,
            onDone: (payload) => {
              finish()
              if (payload.conversation_id) setCurrentId(payload.conversation_id)
              loadConversations()
            },
            onError: (msg) => {
              finish(`⚠️ ${msg}`)
              message.error('生成失败')
            },
          },
          controller.signal,
        )
      } catch (e) {
        finish()
        const err = e as Error
        if (err.name !== 'AbortError') message.error(err.message || '请求失败')
      }
    },
    [streaming, currentId, loadConversations, message],
  )

  const handleRename = useCallback(
    async (id: number, title: string) => {
      try {
        await renameConversation(id, title)
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
      } catch {
        message.error('重命名失败')
      }
    },
    [message],
  )

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteConversation(id)
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (currentId === id) {
          setCurrentId(null)
          setMessages([])
        }
      } catch {
        message.error('删除失败')
      }
    },
    [currentId, message],
  )

  return (
    <Layout className="app-layout">
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onSelect={selectConversation}
        onNew={newChat}
        onRename={handleRename}
        onDelete={handleDelete}
      />
      <ChatWindow
        messages={messages}
        streaming={streaming}
        currentTitle={conversations.find((c) => c.id === currentId)?.title}
        onSend={handleSend}
        onStop={() => abortRef.current?.abort()}
      />
    </Layout>
  )
}

export default App
