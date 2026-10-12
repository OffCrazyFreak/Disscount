import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

export default function VerificationEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}

VerificationEmail.PreviewProps = previewProps("verification");
