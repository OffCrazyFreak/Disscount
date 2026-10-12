import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

export default function PasswordResetEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}
