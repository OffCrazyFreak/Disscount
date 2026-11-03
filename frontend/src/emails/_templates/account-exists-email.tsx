import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

// Sent when someone signs up with the address of a verified account.
export default function AccountExistsEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}
