import CodeEmail, {
  type ICodeEmailProps,
} from "@/emails/components/code-email";
import { codePreviewProps } from "@/emails/_preview/preview-props";

// Preview-only: the send path renders the shared component itself, so these catalogs never reach production.
export default function ReauthCodeEmailPreview(props: ICodeEmailProps) {
  return <CodeEmail {...props} />;
}

ReauthCodeEmailPreview.PreviewProps = codePreviewProps();
