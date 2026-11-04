import ActionEmail, {
  type IActionEmailProps,
} from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

// Preview-only entry: the send path renders the shared component itself, so the
// catalogs loaded here never reach production.
export default function PasswordChangedEmailPreview(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}

PasswordChangedEmailPreview.PreviewProps = previewProps("passwordChanged");
