import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";
import { previewProps } from "@/emails/_preview/preview-props";

// Goes to the CURRENT address, so a hijacked session can't move the account.
export default function ChangeEmailConfirmation(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}

ChangeEmailConfirmation.PreviewProps = previewProps("changeEmail");
