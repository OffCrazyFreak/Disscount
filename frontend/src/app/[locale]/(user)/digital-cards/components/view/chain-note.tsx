import { ExternalLink, Info } from "lucide-react";
import { useTranslations } from "next-intl";

import { getChainWalletNote } from "@/app/[locale]/(user)/digital-cards/utils/chain-wallet-notes";

interface IChainNoteProps {
  chainCode: string | null;
}

export default function ChainNote({ chainCode }: IChainNoteProps) {
  const t = useTranslations("digitalCards");
  const note = getChainWalletNote(chainCode);

  if (!note) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
      <Info
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-blue-600"
      />

      <div className="flex flex-col gap-1">
        <p>{t(`chainNotes.${note.code}.text`)}</p>

        <a
          href={note.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          {t(`chainNotes.${note.code}.link`)}
          <ExternalLink aria-hidden="true" className="size-3.5" />
          <span className="sr-only">{t("view.newTab")}</span>
        </a>
      </div>
    </div>
  );
}
