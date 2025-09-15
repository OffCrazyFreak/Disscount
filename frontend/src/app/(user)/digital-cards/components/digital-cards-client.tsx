"use client";

import { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Search, Plus, Loader2, PlusIcon, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/custom/search-bar";
import DigitalCardModal from "@/app/(user)/digital-cards/components/forms/digital-card-modal";
import DigitalCardsGroup from "@/app/(user)/digital-cards/components/digital-cards-group";
import NoResults from "@/components/custom/no-results";
import { FloatingActionButton } from "@/components/custom/floating-action-button";
import { DigitalCardDto } from "@/lib/api/types";
import { useViewMode } from "@/hooks/use-view-mode";
import { filterByFields } from "@/utils/generic";
import { digitalCardService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import ViewSwitcher from "@/components/custom/view-switcher";

export default function DigitalCardsClient({ query }: { query: string }) {
  const pathname = usePathname();
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

      <div className="space-y-4">
        <Suspense>
          <SearchBar
            placeholder="Pretraži digitalne kartice..."
            searchRoute={pathname}
            clearable={true}
            submitButtonLocation="None"
            autoSearch={true}
          />
        </Suspense>

        <div className="flex items-center justify-between gap-4">
          <h3>
            {query.length > 0
              ? `Rezultati pretrage za "${query}"${
                  isLoading ? "" : ` (${matchingDigitalCards.length})`
                }`
              : `Moje digitalne kartice${
                  isLoading ? "" : ` (${matchingDigitalCards.length})`
                }`}
          </h3>

          <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Dohvaćanje kartica…</span>
          </div>
        ) : matchingDigitalCards.length > 0 ? (
          <DigitalCardsGroup
            digitalCards={matchingDigitalCards}
            handleEdit={handleEdit}
            viewMode={viewMode}
          />
        ) : query ? (
          <NoResults
            icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
          />
        ) : (
          <div className="text-center py-12">
            <CreditCard className="size-12 text-gray-400 mx-auto mb-4" />
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
      </div>
    </>
  );
}
