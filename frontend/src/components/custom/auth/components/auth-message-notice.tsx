import { CircleAlert } from "lucide-react";

interface IAuthMessageNoticeProps {
  message: string;
}

export default function AuthMessageNotice({ message }: IAuthMessageNoticeProps) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm font-medium text-green-800 shadow-sm">
      <CircleAlert className="size-7 shrink-0 text-green-600" />
      <span>{message}</span>
    </div>
  );
}
