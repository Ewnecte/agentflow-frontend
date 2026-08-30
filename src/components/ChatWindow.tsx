import ChatInput from './ChatInput'
import MessageList from './MessageList'
import type { ChatMessage } from '../types'

interface Props {
  messages: ChatMessage[]
  streaming: boolean
  currentTitle?: string
  onSend: (content: string) => void
  onStop: () => void
}

export default function ChatWindow({ messages, streaming, currentTitle, onSend, onStop }: Props) {
  return (
    <div className="chat-window">
      <div className="chat-header">
        <span className="chat-header-title">{currentTitle || '新对话'}</span>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-logo">AI</div>
          <h1>我能帮你做什么？</h1>
          <ChatInput streaming={streaming} onSend={onSend} onStop={onStop} />
        </div>
      ) : (
        <>
          <MessageList messages={messages} />
          <div className="chat-input-bar">
            <ChatInput streaming={streaming} onSend={onSend} onStop={onStop} />
          </div>
        </>
      )}
    </div>
  )
}
