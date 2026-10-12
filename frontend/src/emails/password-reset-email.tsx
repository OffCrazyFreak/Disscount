import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

export default function PasswordResetEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}

PasswordResetEmail.PreviewProps = previewProps("passwordReset");
