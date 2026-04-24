import { User, Lock } from "lucide-react";
import { motion } from "motion/react";

interface CommentItemProps {
  author: string;
  timestamp: string;
  content: string;
  isInternal?: boolean;
}

export function CommentItem({ author, timestamp, content, isInternal }: CommentItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 bg-muted/50 rounded-lg"
    >
      <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
        <User className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">{author}</span>
          {isInternal && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Interno</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{timestamp}</p>
        <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
}
