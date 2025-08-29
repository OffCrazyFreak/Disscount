"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Loader2,
  PlusIcon,
  CreditCard,
  Frown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DigitalCardSearchBar from "@/app/digital-cards/components/digital-card-search-bar";
import SearchItemsLayout from "@/components/layouts/search-items-layout";
import DigitalCardModal from "@/app/digital-cards/components/forms/digital-card-modal";
import DigitalCardsGroup from "@/app/digital-cards/components/digital-cards-group";
import NoResults from "@/components/custom/no-results";
import { FloatingActionButton } from "@/components/custom/floating-action-button";
import { DigitalCardDto } from "@/lib/api/types";
import { useViewMode } from "@/hooks/use-view-mode";
import { filterByFields } from "@/lib/utils";
import { digitalCardService } from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";

export default function DigitalCardsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDigitalCard, setSelectedDigitalCard] =
    useState<DigitalCardDto | null>(null);
  const [viewMode, setViewMode] = useViewMode("/digital-cards", "grid");

  // Use user context for authentication and digital cards data
  const {
    isAuthenticated,
    digitalCards: contextDigitalCards,
    isLoading: userLoading,
  } = useUser();

  // React Query hook (disabled when not authenticated)
  const { refetch } = digitalCardService.useGetUserDigitalCards();

  // Use context data if authenticated and available, otherwise show empty array
  const digitalCards = isAuthenticated ? contextDigitalCards : [];
  const isLoading = userLoading;

  const deleteCardMutation = digitalCardService.useDeleteDigitalCard();

  function handleSearch(q: string) {
    if (!q) {
      router.push(`/digital-cards`);
    } else {
      router.push(`/digital-cards?q=${encodeURIComponent(q)}`);
    }
  }

  const handleCreateSuccess = () => {
    refetch();
  };

  const handleEdit = (digitalCard: DigitalCardDto) => {
    setSelectedDigitalCard(digitalCard);
    setIsModalOpen(true);
  };

  const handleDelete = async (digitalCard: DigitalCardDto) => {
    if (
      confirm(
        `Jeste li sigurni da želite obrisati karticu "${digitalCard.title}"?`
      )
    ) {
      try {
        await deleteCardMutation.mutateAsync(digitalCard.id);
        toast.success("Digitalna kartica je uspješno obrisana.");
        refetch();
      } catch (error) {
        toast.error("Došlo je do greške prilikom brisanja kartice.");
      }
    }
  };

  const handleCopy = (digitalCard: DigitalCardDto) => {
    toast.success(`Kod kartice "${digitalCard.title}" je kopiran u clipboard.`);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) setSelectedDigitalCard(null);
  };

  const filteredDigitalCards = filterByFields(digitalCards, initialQuery, [
    "title",
    "type",
    "note",
  ]);

  return (
    <>
      <DigitalCardModal
        isOpen={isModalOpen}
        onOpenChange={handleModalOpenChange}
        onSuccess={handleCreateSuccess}
        digitalCard={selectedDigitalCard}
      />

      <FloatingActionButton
        onClick={() => setIsModalOpen(true)}
        icon={<PlusIcon size={24} />}
        label="Dodaj digitalnu karticu"
      />

      <SearchItemsLayout
        title={
          initialQuery.length > 0
            ? `Rezultati pretrage za "${initialQuery}" (${filteredDigitalCards.length})`
            : `Moje digitalne kartice (${filteredDigitalCards.length})`
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
            <p className="text-gray-600">Dohvaćanje digitalnih kartica...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {filteredDigitalCards.length > 0 ? (
              <DigitalCardsGroup
                digitalCards={filteredDigitalCards}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
                viewMode={viewMode}
              />
            ) : initialQuery.length > 0 ? (
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
                  Stvorite svoju prvu digitalnu karticu i počnite organizirati
                  svoje kartice
                </p>

                <Button
                  effect={"shineHover"}
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
      </SearchItemsLayout>
    </>
  );
}
