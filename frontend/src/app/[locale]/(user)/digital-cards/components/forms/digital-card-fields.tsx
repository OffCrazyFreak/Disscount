"use client";

import BarcodeValueField from "@/app/[locale]/(user)/digital-cards/components/forms/barcode-value-field";
import CardColorField from "@/app/[locale]/(user)/digital-cards/components/forms/card-color-field";
import CardDetailsSection from "@/app/[locale]/(user)/digital-cards/components/forms/card-details-section";
import CardNameField from "@/app/[locale]/(user)/digital-cards/components/forms/card-name-field";
import CardNoteField from "@/app/[locale]/(user)/digital-cards/components/forms/card-note-field";
import CardTypeField from "@/app/[locale]/(user)/digital-cards/components/forms/card-type-field";
import CodePreview from "@/app/[locale]/(user)/digital-cards/components/forms/code-preview";
import CodeTypeField from "@/app/[locale]/(user)/digital-cards/components/forms/code-type-field";
import CodeValueField from "@/app/[locale]/(user)/digital-cards/components/forms/code-value-field";
import CardPhotosField from "@/app/[locale]/(user)/digital-cards/components/forms/photos/card-photos-field";
import StoreField from "@/app/[locale]/(user)/digital-cards/components/forms/store-field/store-field";

type PhotosProps = Parameters<typeof CardPhotosField>[0];

interface IDigitalCardFieldsProps {
  isEdit: boolean;
  photos: PhotosProps;
}

export default function DigitalCardFields({
  isEdit,
  photos,
}: IDigitalCardFieldsProps) {
  return (
    <>
      <StoreField autoColor={!isEdit} />
      <CardNameField />
      <CardTypeField />

      <CodeValueField />
      <CodeTypeField />
      <CodePreview />
      <BarcodeValueField />

      <CardColorField />
      <CardPhotosField {...photos} />
      <CardNoteField />
      <CardDetailsSection />
    </>
  );
}
