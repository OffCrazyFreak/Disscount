import {
  SECTION_FIELDS,
  SettingsFormValues,
  SettingsSection,
} from "@/components/custom/settings/settings-schema";

function fieldChanged(
  values: SettingsFormValues,
  defaults: Partial<SettingsFormValues>,
  field: keyof SettingsFormValues,
): boolean {
  return JSON.stringify(values[field]) !== JSON.stringify(defaults[field]);
}

// Value-compare against the form's default baseline instead of trusting RHF's
// dirtyFields shape (array fields report per-index flags there).
export function dirtySections(
  values: SettingsFormValues,
  defaults: Partial<SettingsFormValues>,
  avatarTouched: boolean,
): Set<SettingsSection> {
  const sections = new Set<SettingsSection>();

  for (const [section, fields] of Object.entries(SECTION_FIELDS)) {
    if (fields.some((field) => fieldChanged(values, defaults, field))) {
      sections.add(section as SettingsSection);
    }
  }

  if (avatarTouched) sections.add("profil");
  return sections;
}
