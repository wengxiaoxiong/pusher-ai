import { Badge } from "@/components/ui/badge"

interface Memo {
  id: string
  key: string
  content: string
  category: string | null
}

interface MemoCardProps {
  memo: Memo
}

export function MemoCard({ memo }: MemoCardProps) {
  return (
    <div className="rounded border border-border/50 p-2 bg-muted/20">
      <p className="text-xs font-medium truncate">{memo.key}</p>
      <p className="text-xs text-muted-foreground truncate line-clamp-2">{memo.content}</p>
      {memo.category && (
        <Badge variant="outline" className="text-xs mt-1">
          {memo.category}
        </Badge>
      )}
    </div>
  )
}
