import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

// Sent when someone signs up again with the address of an unverified account.
export default function CompleteSignUpEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}
