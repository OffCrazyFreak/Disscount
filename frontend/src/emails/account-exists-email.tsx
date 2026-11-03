import AccountExistsEmail from "@/emails/_templates/account-exists-email";
import type { IActionEmailProps } from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

// Preview-only entry: the send path imports the template from _templates, so the
// catalogs loaded here never reach production.
export default function AccountExistsEmailPreview(props: IActionEmailProps) {
  return <AccountExistsEmail {...props} />;
}

AccountExistsEmailPreview.PreviewProps = previewProps("accountExists");
