import BreachedPasswordEmail from "@/emails/_templates/breached-password-email";
import type { IActionEmailProps } from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

// Preview-only entry: the send path imports the template from _templates, so the
// catalogs loaded here never reach production.
export default function BreachedPasswordEmailPreview(props: IActionEmailProps) {
  return <BreachedPasswordEmail {...props} />;
}

BreachedPasswordEmailPreview.PreviewProps = previewProps("breachedPassword");
