import ReauthCodeEmail from "@/emails/_templates/reauth-code-email";
import type { ICodeEmailProps } from "@/emails/components/code-email";
import { codePreviewProps } from "@/emails/_preview/preview-props";

// Preview-only entry: the send path imports the template from _templates, so the
// catalogs loaded here never reach production.
export default function ReauthCodeEmailPreview(props: ICodeEmailProps) {
  return <ReauthCodeEmail {...props} />;
}

ReauthCodeEmailPreview.PreviewProps = codePreviewProps();
