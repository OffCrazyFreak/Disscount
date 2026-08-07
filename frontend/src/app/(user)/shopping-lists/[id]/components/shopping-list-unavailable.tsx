"use client";

import { ArrowLeft, Lock, WifiOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import NoResults from "@/components/custom/common/no-results";
import { parseProblem } from "@/lib/api/problem-details";

interface IShoppingListUnavailableProps {
  error: Error | null;
  onRetry: () => void;
  isSignedIn: boolean;
}

/**
 * Why the list is not here. Only a 404 means the link is dead, so everything else offers
 * a retry: telling a shopper on flaky mobile data that the owner revoked their access
 * sends them off to ask for a new link they do not need.
 */
export default function ShoppingListUnavailable({
  error,
  onRetry,
  isSignedIn,
}: IShoppingListUnavailableProps) {
  const isDeadLink = parseProblem(error)?.status === 404;

  if (isDeadLink) {
    return (
      <div className="mx-auto">
        {/* A list that stopped being shared and one that never existed read the same on
            purpose, so the wording cannot be used to confirm an id is real. */}
        <NoResults
          icon={
            <Lock
              aria-hidden="true"
              className="mx-auto mb-4 size-12 text-muted-foreground"
            />
          }
          title="Poveznica više ne vrijedi"
          description="Vlasnik je prestao dijeliti ovaj popis ili je poveznica netočna."
        />

        <div className="text-center">
          <Button asChild variant="ghost">
            <Link href={isSignedIn ? "/shopping-lists" : "/products"}>
              <ArrowLeft aria-hidden="true" />
              {isSignedIn ? "Natrag na popise za kupnju" : "Istraži proizvode"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <NoResults
        icon={
          <WifiOff
            aria-hidden="true"
            className="mx-auto mb-4 size-12 text-muted-foreground"
          />
        }
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
