import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";

interface IInboxNoticeProps {
  title: string;
  description: string;
  email?: string;
}

// Neutral "go check your inbox" panel shown after any action that sends an email
// (signup verification, password reset request). Worded so it never reveals whether the
// address has an account.
export default function InboxNotice({
  title,
  description,
  email,
}: IInboxNoticeProps) {
  const t = useTranslations("auth");

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-primary">
        <MailCheck className="size-6" />
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="text-sm text-muted-foreground">{description}</p>

      {email && <p className="text-sm font-medium">{email}</p>}

      <p className="text-xs text-muted-foreground">{t("inboxSpamHint")}</p>
    </div>
  );
}
