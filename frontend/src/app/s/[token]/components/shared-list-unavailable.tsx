"use client";

import { ArrowLeft, Lock, WifiOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import NoResults from "@/components/custom/common/no-results";
import { parseProblem } from "@/lib/api/problem-details";

interface ISharedListUnavailableProps {
  error: Error | null;
  onRetry: () => void;
}

/**
 * Why the list is not here. Only a 404 means the link is dead, so everything else offers
 * a retry: telling a shopper on flaky mobile data that the owner revoked their access
 * sends them off to ask for a new link they do not need.
 */
export default function SharedListUnavailable({
  error,
  onRetry,
}: ISharedListUnavailableProps) {
  const isDeadLink = parseProblem(error)?.status === 404;

  if (isDeadLink) {
    return (
      <div className="mx-auto">
        {/* A revoked token and one that never existed read the same on purpose, so the
            wording cannot be used to confirm a list is there. */}
        <NoResults
          icon={<Lock className="mx-auto mb-4 size-12 text-gray-400" />}
          title="Poveznica više ne vrijedi"
          description="Vlasnik je prestao dijeliti ovaj popis ili je poveznica netočna."
        />

        <div className="text-center">
          <Button asChild variant="ghost">
            <Link href="/products">
              <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
              Istraži proizvode
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <NoResults
        icon={<WifiOff className="mx-auto mb-4 size-12 text-gray-400" />}
        title="Popis se ne može učitati"
        description="Provjeri internetsku vezu i pokušaj ponovno."
      />

      <div className="text-center">
        <Button variant="primary" onClick={onRetry}>
          Pokušaj ponovno
        </Button>
      </div>
    </div>
  );
}
