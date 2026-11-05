---
name: ui-handover
description: Checks a Disscount UI change before handover, covering accessibility, every changed screen in the T3 preview, and PR and board screenshots. Use when a change alters anything rendered, before opening its PR or moving its card.
---

# UI handover

Run these in order. A fix that would alter size, spacing or colour goes to the owner first, with before and after screenshots.

## Accessibility

Accessibility is what the owner most often fixes afterwards, so check each:

- Every icon-only control has an accessible name that does not contradict a visible label beside it.
- Decorative icons are hidden from the accessibility tree.
- Everything clickable works by keyboard.
- A control inside a card does not trigger the card's own navigation.
- Dialogs move focus in on open and restore it on close.
- Counts and status that change without a navigation are announced.
- Motion respects `prefers-reduced-motion`.

## Preview

1. Run the worktree's dev server.
2. Open every changed screen in the T3 preview.
3. Walk each changed state.

For admin screens on dev, sign in with `DEV_ACCOUNT_*` in an incognito preview tab, and mask other users' names and emails before any screenshot.

## PR screenshots

1. Ask the owner in a question card: attach them yourself, the owner attaches them, or none.
2. Attach with `gh pr create`, `gh pr edit` or `gh issue comment` and `--attach '<file>#<alt>'`.

Never host screenshots on a branch, because GitHub can collect the commits behind those links once it is deleted. `--attach` rewrites Markdown images, not `<img>` tags.

## After the merge

User-facing work goes to For review on the board, with screenshots on the card, because the owner moves it to Done after looking.

1. Capture the changed screens on dev.disscount.me.
2. Attach them with `gh issue comment --attach`; a draft becomes an issue first.
3. As a delegate, list "attach screenshots?" under Open questions.
