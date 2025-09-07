"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Loader2,
  PlusIcon,
  CreditCard,
  Frown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DigitalCardSearchBar from "@/app/(user)/digital-cards/components/digital-card-search-bar";
import UserInventoryLayout from "@/app/(user)/layout";
import DigitalCardModal from "@/app/(user)/digital-cards/components/forms/digital-card-modal";
import DigitalCardsGroup from "@/app/(user)/digital-cards/components/digital-cards-group";
import NoResults from "@/components/custom/no-results";
import { FloatingActionButton } from "@/components/custom/floating-action-button";
import { DigitalCardDto } from "@/lib/api/types";
import { useViewMode } from "@/hooks/use-view-mode";
import { filterByFields } from "@/utils/generic";
import { digitalCardService } from "@/lib/api";
import { useUser } from "@/context/user-context";

export default function DigitalCardsClient({ query }: { query: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDigitalCard, setSelectedDigitalCard] =
    useState<DigitalCardDto | null>(null);
  const [viewMode, setViewMode] = useViewMode(pathname, "grid");

  const {
    isAuthenticated,
    digitalCards: contextDigitalCards,
    isLoading,
  } = useUser();
  const { refetch } = digitalCardService.useGetUserDigitalCards();
  const digitalCards = isAuthenticated ? contextDigitalCards : [];

  function handleSearch(query: string) {
    if (!query) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?q=${encodeURIComponent(query)}`);
    }
  }

  function handleEdit(digitalCard: DigitalCardDto) {
    setSelectedDigitalCard(digitalCard);
    setIsModalOpen(true);
  }

  const matchingDigitalCards = filterByFields(digitalCards, query, [
    "title",
    "type",
    "note",
  ]);

  return (
    <>
      <DigitalCardModal
        isOpen={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setSelectedDigitalCard(null);
        }}
        onSuccess={refetch}
        digitalCard={selectedDigitalCard}
      />

      <FloatingActionButton
        onClick={() => setIsModalOpen(true)}
        icon={<PlusIcon size={24} />}
        label="Dodaj digitalnu karticu"
      />

      <UserInventoryLayout
        title={
          query
            ? `Rezultati: "${query}" (${matchingDigitalCards.length})`
            : `Moje digitalne kartice (${matchingDigitalCards.length})`
        }
        search={
          <DigitalCardSearchBar
            onSearch={handleSearch}
            showSubmitButton
            showBarcode={false}
          />
        }
        viewMode={viewMode}
        setViewMode={setViewMode}
      >
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="size-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Dohvaćanje kartica…</p>
          </div>
        )}

        {!isLoading && (
          <>
            {matchingDigitalCards.length > 0 ? (
              <DigitalCardsGroup
                digitalCards={matchingDigitalCards}
                handleEdit={handleEdit}
                viewMode={viewMode}
              />
            ) : query ? (
              <NoResults
                icon={<Search className="size-20 text-gray-400 mx-auto mb-4" />}
              />
            ) : (
              <div className="text-center py-12">
                <CreditCard className="size-20 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nema digitalnih kartica
                </h3>
                <p className="text-gray-600 mb-6">
                  Stvorite svoju prvu digitalnu karticu…
                </p>
                <Button
                  effect="shineHover"
                  icon={Plus}
                  iconPlacement="left"
                  onClick={() => setIsModalOpen(true)}
                >
                  Dodaj digitalnu karticu
                </Button>
              </div>
            )}
          </>
        )}
      </UserInventoryLayout>
    </>
  );
}
