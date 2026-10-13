import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

// Sent when a correct sign-in is refused because the password is in a known breach.
export default function BreachedPasswordEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}
