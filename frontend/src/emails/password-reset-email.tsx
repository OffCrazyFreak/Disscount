import PasswordResetEmail from "@/emails/_templates/password-reset-email";
import type { IActionEmailProps } from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

// Preview-only entry: the send path imports the template from _templates, so the
// catalogs loaded here never reach production.
export default function PasswordResetEmailPreview(props: IActionEmailProps) {
  return <PasswordResetEmail {...props} />;
}

PasswordResetEmailPreview.PreviewProps = previewProps("passwordReset");
