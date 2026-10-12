import ChangeEmailConfirmation from "@/emails/_templates/change-email-confirmation";
import type { IActionEmailProps } from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

// Preview-only entry: the send path imports the template from _templates, so the
// catalogs loaded here never reach production.
export default function ChangeEmailConfirmationPreview(
  props: IActionEmailProps,
) {
  return <ChangeEmailConfirmation {...props} />;
}

ChangeEmailConfirmationPreview.PreviewProps = previewProps("changeEmail");
