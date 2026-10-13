import { ExternalLink, Info } from "lucide-react";

import { getChainWalletNote } from "@/app/(user)/digital-cards/utils/chain-wallet-notes";

interface IChainNoteProps {
  chainCode: string | null;
}

export default function ChainNote({ chainCode }: IChainNoteProps) {
  const note = getChainWalletNote(chainCode);

  if (!note) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
      <Info
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-blue-600"
      />

      <div className="flex flex-col gap-1">
        <p>{note.text}</p>

        {note.href && (
          <a
            href={note.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            {note.linkLabel ?? "Saznaj više"}
            <ExternalLink aria-hidden="true" className="size-3.5" />
            <span className="sr-only">(otvara se u novoj kartici)</span>
          </a>
        )}
      </div>
    </div>
  );
}
