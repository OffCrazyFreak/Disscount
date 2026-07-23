import { MailCheck } from "lucide-react";

interface IInboxNoticeProps {
  title: string;
  description: string;
  email?: string;
}

// Worded so it never reveals whether the address has an account.
export default function InboxNotice({
  title,
  description,
  email,
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
    </div>
  );
}
