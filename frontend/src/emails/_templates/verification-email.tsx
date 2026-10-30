import ActionEmail, {
  IActionEmailProps,
} from "@/emails/components/action-email";

export default function VerificationEmail(props: IActionEmailProps) {
  return <ActionEmail {...props} />;
}
