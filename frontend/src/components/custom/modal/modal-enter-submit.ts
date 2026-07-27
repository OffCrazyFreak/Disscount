import type { KeyboardEvent } from "react";

const ENTER_CONTROL_SELECTOR = [
  "a[href]",
  "button",
  "select",
  "summary",
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="treeitem"]',
  'input[type="button"]',
  'input[type="checkbox"]',
  'input[type="color"]',
  'input[type="file"]',
  'input[type="image"]',
  'input[type="radio"]',
  'input[type="range"]',
  'input[type="reset"]',
  'input[type="submit"]',
].join(",");

interface IModalEnterSubmitOptions {
  formId?: string;
  onSubmit?: () => void;
  disabled?: boolean;
}

function getForm(
  target: HTMLElement,
  modal: HTMLElement,
  formId?: string,
): HTMLFormElement | null {
  if (formId) {
    const form = document.getElementById(formId);
    return form instanceof HTMLFormElement ? form : null;
  }

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return target.form;
  }

  return modal.querySelector("form");
}

function getSubmitter(
  form: HTMLFormElement,
  modal: HTMLElement,
): HTMLButtonElement | HTMLInputElement | undefined {
  const candidates = modal.querySelectorAll<
    HTMLButtonElement | HTMLInputElement
  >('button[type="submit"], input[type="submit"]');

  return Array.from(candidates).find((candidate) => candidate.form === form);
}

export function handleModalEnterSubmit(
  event: KeyboardEvent<HTMLElement>,
  { formId, onSubmit, disabled = false }: IModalEnterSubmitOptions,
) {
  if (
    event.key !== "Enter" ||
    event.defaultPrevented ||
    event.repeat ||
    event.nativeEvent.isComposing
  ) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target instanceof HTMLTextAreaElement && event.shiftKey) return;
  if (target.closest(ENTER_CONTROL_SELECTOR)) return;

  const form = getForm(target, event.currentTarget, formId);
  const submitter = form ? getSubmitter(form, event.currentTarget) : undefined;

  if (disabled || submitter?.disabled) {
    event.preventDefault();
    return;
  }

  if (form) {
    event.preventDefault();
    form.requestSubmit(submitter);
    return;
  }

  if (onSubmit) {
    event.preventDefault();
    onSubmit();
  }
}
