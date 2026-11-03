import PasswordChangedEmail from "@/emails/_templates/password-changed-email";
import type { IActionEmailProps } from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

// Preview-only entry: the send path imports the template from _templates, so the
// catalogs loaded here never reach production.
export default function PasswordChangedEmailPreview(props: IActionEmailProps) {
  return <PasswordChangedEmail {...props} />;
}

PasswordChangedEmailPreview.PreviewProps = previewProps("passwordChanged");
