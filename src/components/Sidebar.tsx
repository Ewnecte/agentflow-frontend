import { useState } from 'react'
import Modal from './Modal'
import { IconChat, IconEdit, IconMenu, IconPlus, IconTrash } from './icons'
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
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null)

  const openRename = (c: ConversationSummary) => {
    setRenameTarget(c)
    setRenameValue(c.title)
  }

  const submitRename = () => {
    if (renameTarget && renameValue.trim()) onRename(renameTarget.id, renameValue.trim())
    setRenameTarget(null)
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="icon-btn" onClick={onToggleCollapse} title={collapsed ? '展开侧边栏' : '收起侧边栏'}>
          <IconMenu />
        </button>
        {!collapsed && (
          <button className="new-chat-btn" onClick={onNew}>
            <IconPlus />
            新对话
          </button>
        )}
      </div>

      {!collapsed && (
        <nav className="conversation-list">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`conversation-item ${c.id === currentId ? 'active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <IconChat className="conversation-icon" />
              <span className="conversation-title" title={c.title}>
                {c.title}
              </span>
              <span className="item-actions">
                <button
                  className="icon-btn small"
                  title="重命名"
                  onClick={(e) => {
                    e.stopPropagation()
                    openRename(c)
                  }}
                >
                  <IconEdit />
                </button>
                <button
                  className="icon-btn small danger"
                  title="删除"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(c)
                  }}
                >
                  <IconTrash />
                </button>
              </span>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="empty-hint">暂无对话，点击「新对话」开始</div>
          )}
        </nav>
      )}

      <Modal
        open={renameTarget != null}
        title="重命名会话"
        onClose={() => setRenameTarget(null)}
        footer={
          <>
            <button className="btn" onClick={() => setRenameTarget(null)}>
              取消
            </button>
            <button className="btn primary" onClick={submitRename} disabled={!renameValue.trim()}>
              确定
            </button>
          </>
        }
      >
        <input
          className="text-input"
          value={renameValue}
          autoFocus
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitRename()
          }}
          placeholder="输入新标题"
        />
      </Modal>

      <Modal
        open={deleteTarget != null}
        title="删除对话"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button className="btn" onClick={() => setDeleteTarget(null)}>
              取消
            </button>
            <button
              className="btn danger"
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              删除
            </button>
          </>
        }
      >
        <p className="modal-text">确定删除「{deleteTarget?.title}」吗？删除后无法恢复。</p>
      </Modal>
    </aside>
  )
}
