import Breadcrumbs from "@/components/custom/common/display/breadcrumbs";
import JsonLdScript from "@/components/custom/common/shell/json-ld-script";
import type { AppLocale } from "@/i18n/locales";
import {
  breadcrumbStepsJsonLd,
  type IBreadcrumbStep,
} from "@/utils/seo/breadcrumb-json-ld";

interface IPageBreadcrumbsProps {
  label: string;
  steps: IBreadcrumbStep[];
  locale: AppLocale;
}

/** One list feeds the visible trail and its BreadcrumbList, so the two never disagree. */
export default function PageBreadcrumbs({
  label,
  steps,
  locale,
}: IPageBreadcrumbsProps) {
  const lastIndex = steps.length - 1;

  return (
    <>
      <JsonLdScript data={breadcrumbStepsJsonLd(steps, locale)} />

      <Breadcrumbs
        label={label}
        items={steps.map((step, index) =>
          index === lastIndex
            ? { label: step.label }
            : { label: step.label, href: step.path },
        )}
      />
    </>
  );
}
