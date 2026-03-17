import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Trash2 } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { Avatar } from '@/components/common/AvatarGroup'
import { CURRENT_USER_ID } from '@/lib/constants'

interface TaskCommentsProps {
  taskId: string
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { getCommentsForTask, addComment, deleteComment, profiles } = useTaskStore()
  const [draft, setDraft] = useState('')

  const comments = getCommentsForTask(taskId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    addComment({
      id: crypto.randomUUID(),
      taskId,
      profileId: CURRENT_USER_ID,
      content: text,
      createdAt: new Date().toISOString(),
    })
    setDraft('')
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={13} className="text-text-tertiary" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
          Comments
        </span>
        {comments.length > 0 && (
          <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="mb-4 text-xs text-text-tertiary">No comments yet.</p>
      ) : (
        <div className="mb-4 space-y-4">
          {comments.map((comment) => {
            const profile = profiles.find((p) => p.id === comment.profileId)
            const isOwn = comment.profileId === CURRENT_USER_ID
            return (
              <div key={comment.id} className="flex gap-2.5">
                {profile && <Avatar profile={profile} size="sm" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary">
                      {profile?.fullName ?? 'Unknown'}
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        title="Delete comment"
                        className="ml-auto flex h-5 w-5 items-center justify-center rounded text-text-tertiary opacity-0 transition-all hover:bg-surface-3 hover:text-red-500 group-hover:opacity-100"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-text-secondary">{comment.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment..."
          className="h-8 flex-1 rounded-md border border-border-subtle bg-surface-2 px-3 text-xs text-text-primary outline-none placeholder:text-text-tertiary focus:border-border-strong"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="h-8 rounded-md bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Comment
        </button>
      </form>
    </div>
  )
}
