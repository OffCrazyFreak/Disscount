import { MailCheck } from "lucide-react";

interface IInboxNoticeProps {
  title: string;
  description: string;
  email?: string;
  hint?: string;
}

// Shown after an action that sends an email (signup verification, password reset request)
// so the user knows to go check their inbox.
export default function InboxNotice({
  title,
  description,
  email,
  hint,
}: IInboxNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-primary">
        <MailCheck className="size-6" />
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="text-sm text-muted-foreground">{description}</p>

      {email && <p className="text-sm font-medium">{email}</p>}

      <p className="text-xs text-muted-foreground">
        Ne zaboravi provjeriti i spam / neželjenu poštu.
      </p>

      {hint && (
        <p className="mt-1 rounded-md border border-dashed bg-muted/40 p-2.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
