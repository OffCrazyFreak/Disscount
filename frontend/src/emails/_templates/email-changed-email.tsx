import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

// Security notice after a confirmed email change, to the old address.
export default function EmailChangedEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}
