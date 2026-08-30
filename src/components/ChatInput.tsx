import { useRef, useState } from 'react'
import { IconSend } from './icons'

interface Props {
  streaming: boolean
  onSend: (content: string) => void
  onStop?: () => void
}

export default function ChatInput({ streaming, onSend, onStop }: Props) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const text = value.trim()
    if (!text || streaming) return
    onSend(text)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const autoResize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="chat-input">
      <textarea
        ref={ref}
        className="chat-textarea"
        value={value}
        rows={1}
        placeholder="输入消息…（Enter 发送，Shift+Enter 换行）"
        disabled={streaming}
        onChange={(e) => {
          setValue(e.target.value)
          autoResize()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
      />
      {streaming ? (
        <button className="btn danger" onClick={onStop}>
          停止
        </button>
      ) : (
        <button className="btn primary send-btn" onClick={submit} disabled={!value.trim()}>
          <IconSend />
          发送
        </button>
      )}
    </div>
  )
}
