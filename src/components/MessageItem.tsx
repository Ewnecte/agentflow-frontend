import { RobotOutlined, UserOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '../types'

export default function MessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">{isUser ? <UserOutlined /> : <RobotOutlined />}</div>
      <div className="message-body">
        {isUser ? (
          <div className="message-bubble">{message.content}</div>
        ) : (
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            {message.pending && <span className="cursor" />}
          </div>
        )}
      </div>
    </div>
  )
}
