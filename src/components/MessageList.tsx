import { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'
import type { ChatMessage } from '../types'

export default function MessageList({ messages }: { messages: ChatMessage[] }) {
  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)

  const onScroll = () => {
    const el = listRef.current
    if (!el) return
    // 距底部小于 80px 视为「贴底」，仅在贴底时跟随滚动，避免打断用户回看历史
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    if (stickRef.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="message-list" ref={listRef} onScroll={onScroll}>
      {messages.map((m) => (
        <MessageItem key={m.id} message={m} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
