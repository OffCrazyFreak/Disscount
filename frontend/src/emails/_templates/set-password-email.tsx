import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

// For an OAuth-only account adding a password, so it reads "set", not "reset".
export default function SetPasswordEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}
