import { useState } from 'react'
import { Button, Input } from 'antd'
import { SendOutlined } from '@ant-design/icons'

interface Props {
  streaming: boolean
  onSend: (content: string) => void
  onStop?: () => void
}

export default function ChatInput({ streaming, onSend, onStop }: Props) {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text || streaming) return
    onSend(text)
    setValue('')
  }

  return (
    <div className="chat-input">
      <Input.TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoSize={{ minRows: 1, maxRows: 6 }}
        placeholder="输入消息…（Enter 发送，Shift+Enter 换行）"
        disabled={streaming}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
      />
      {streaming ? (
        <Button danger onClick={onStop}>
          停止
        </Button>
      ) : (
        <Button
          type="primary"
          className="send-btn"
          icon={<SendOutlined />}
          onClick={submit}
          disabled={!value.trim()}
        >
          发送
        </Button>
      )}
    </div>
  )
}
