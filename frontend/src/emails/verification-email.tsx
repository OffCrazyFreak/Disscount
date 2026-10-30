import VerificationEmail from "@/emails/_templates/verification-email";
import type { IActionEmailProps } from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

// Preview-only entry: the send path imports the template from _templates, so the
// catalogs loaded here never reach production.
export default function VerificationEmailPreview(props: IActionEmailProps) {
  return <VerificationEmail {...props} />;
}

VerificationEmailPreview.PreviewProps = previewProps("verification");
