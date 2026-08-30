import { useState } from 'react'
import { Button, Dropdown, Input, Modal } from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { ConversationSummary } from '../types'

interface Props {
  conversations: ConversationSummary[]
  currentId: number | null
  collapsed: boolean
  onToggleCollapse: () => void
  onSelect: (id: number) => void
  onNew: () => void
  onRename: (id: number, title: string) => void
  onDelete: (id: number) => void
}

export default function Sidebar({
  conversations,
  currentId,
  collapsed,
  onToggleCollapse,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: Props) {
  const [renameTarget, setRenameTarget] = useState<ConversationSummary | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const openRename = (c: ConversationSummary) => {
    setRenameTarget(c)
    setRenameValue(c.title)
  }

  const submitRename = () => {
    if (renameTarget && renameValue.trim()) onRename(renameTarget.id, renameValue.trim())
    setRenameTarget(null)
  }

  const confirmDelete = (c: ConversationSummary) => {
    Modal.confirm({
      title: '删除对话',
      content: `确定删除「${c.title}」吗？删除后无法恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => onDelete(c.id),
    })
  }

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Button
          type="text"
          className="collapse-btn"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
        />
        {!collapsed && (
          <Button type="primary" block className="new-chat-btn" icon={<PlusOutlined />} onClick={onNew}>
            新对话
          </Button>
        )}
      </div>

      {!collapsed && (
        <div className="conversation-list">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`conversation-item ${c.id === currentId ? 'active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <MessageOutlined className="conversation-icon" />
              <div className="conversation-title">{c.title}</div>
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    { key: 'rename', icon: <EditOutlined />, label: '重命名' },
                    { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
                  ],
                  onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation()
                    if (key === 'rename') openRename(c)
                    if (key === 'delete') confirmDelete(c)
                  },
                }}
              >
                <Button
                  type="text"
                  size="small"
                  className="more-btn"
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </div>
          ))}
          {conversations.length === 0 && <div className="empty-hint">暂无对话，点击「新对话」开始</div>}
        </div>
      )}

      <Modal
        title="重命名会话"
        open={!!renameTarget}
        onOk={submitRename}
        onCancel={() => setRenameTarget(null)}
        okText="确定"
        cancelText="取消"
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={submitRename}
          placeholder="输入新标题"
        />
      </Modal>
    </div>
  )
}
