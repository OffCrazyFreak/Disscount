import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

// Security notice after a password change or reset.
export default function PasswordChangedEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}
