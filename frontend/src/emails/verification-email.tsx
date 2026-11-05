import ActionEmail, {
  type IActionEmailProps,
} from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

// Preview-only entry: the send path renders the shared component itself, so the
// catalogs loaded here never reach production.
export default function VerificationEmailPreview(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}

VerificationEmailPreview.PreviewProps = previewProps("verification");
