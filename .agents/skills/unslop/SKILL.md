---
name: unslop
description: Cut AI tells from any writing in English or Croatian, including chat replies, docs, PR text, emails and UI copy. Apply it to everything written for a person.
---

# Unslop

Edit text to remove AI patterns and add human voice. Word lists go stale, so trust the patterns over the words.

## Process

1. Scan for the patterns below.
2. Rewrite. Preserve meaning, match intended tone.
3. Add voice (next section).
4. Self-audit: "What makes this obviously AI generated?" Fix what remains.

## Adding voice

Removing patterns is half the job. Sterile, voiceless writing is just as obvious.

- Have opinions. React to facts instead of neutrally listing pros and cons.
- Vary rhythm. A run of short fragments is as machine-made as a run of long sentences.
- Acknowledge complexity. "Impressive but also kind of unsettling" beats "impressive."
- Use "I" when it fits.
- Let some mess in. Perfect structure looks machine-made.
- Be specific. Not "this is concerning" but "there's something unsettling about agents churning away at 3am."

## Structure and rhetoric

1. Contrast frames. "It's not X, it's Y", "not just X, but Y". State the point directly.
2. Salience flags. "This matters", "Here's the thing", "The honest answer is", "It's worth noting". Delete them and say the thing.
3. Rule of three. Forced groups of three. Use the natural number.
4. Bold-lead bullets. A bold label opening each bullet, and bullets or headings on a short answer. Write prose unless the content is a real list.
5. Summary closers and trailing offers. "In short...", "Let me know if...", "The future looks bright." Stop when the content stops.
6. Participial tails. "..., highlighting...", "..., ensuring...", "..., reflecting...". Delete or make it a sentence with a source.
7. Fragment spam. Uniform short sentences and stacked fragments, which replaced the em dash as the tic.
8. Synonym cycling. Protagonist, main character, central figure, all in one paragraph. Pick one, repeat it.
9. False ranges. "from X to Y" where X and Y aren't on a scale. List the topics.
10. Formulaic challenges. "Despite challenges... continues to thrive." Give the facts.

## Words

11. AI vocabulary. Additionally, crucial, delve, enduring, enhance, foster, garner, highlighting, interplay, intricate, landscape (abstract), leverage, multifaceted, pivotal, prioritize, showcase, tapestry, testament, underscore, vibrant, "challenge" as a soft word for problem. Use plain words.
12. Magic adverbs. Quietly, genuinely, fundamentally, truly, simply. Cut them, or use a stronger verb or the measured number.
13. Mannered metaphors and invented labels. Load-bearing, earns its keep, substrate, wedge, vector, locus, nexus, primitive (noun), harness (metaphor), API surface, bedrock, scaffolding (metaphor), paradigm, gold-plating, ratchet, endgame, north star, flywheel, and compound labels coined for the occasion. Pick the concrete word: "substrate" is "base", "wedge in" is "add", "ratchet" is "a limit that only tightens".
14. Fancy ways to say "is". "serves as", "stands as", "boasts", "features". Say "is" or "has".
15. Puffery and promotion. "pivotal moment", "evolving landscape", "indelible mark", "nestled", "breathtaking", "groundbreaking", "renowned". Say what happened.
16. Vague attributions and name-dropping. "Experts believe", "Industry reports suggest", a list of outlets. Name the source and what it said, or delete.
17. False specifics. Precise numbers and details nobody measured. Use the real figure or none.
18. Filler. "In order to" is "to". "Due to the fact that" is "because". "It is important to note that" gets deleted. "could potentially possibly" is "may".
19. Plain word. "utilize" is "use", "facilitate" is "help", "numerous" is "many", "in the event that" is "if".

## Punctuation and format

20. No em or en dashes. Use a comma, a colon, parentheses or a rewrite, whichever reads naturally. A hyphen standing in for a dash is the same tell.
21. Colons and parentheses are fine in their normal jobs: before a list or an example, or for a real aside. The tell is the mid-sentence colon that sets up a reveal ("the answer: simplicity"). Rewrite that one.
22. Straight quotes everywhere, Croatian text included.
23. Dates in Croatian and in everything written to the owner: 03.11.2026. (zero-padded, no spaces, final dot). This is the owner's choice over the norm 3. 11. 2026.
24. Sentence case headings. No decorative emojis. Bold only what the reader must not miss.

## Chat and email

25. Chatbot phrases and sycophancy. "I hope this helps!", "Of course!", "Great question!", "You're absolutely right!", "Found the smoking gun!" Respond directly.
26. Cutoff disclaimers. "While specific details are limited..." Find sources or say what you could not check.
27. Emails. Open with the ask, one ask, about 90 words, the sender's own sign-off. No "I hope this finds you well" or "don't hesitate to reach out".

## Plain speech

28. Say what it does, not how it feels. "SQL you can read" names a feeling; "`.toSQL()` returns the exact string sent to the database" names the mechanism. If a sentence could appear unchanged in another project's docs, cut it.
29. Shorten or split a sentence the reader has to parse twice.
30. Active voice. "The compiler validates queries", not "queries are validated", unless the actor is unknown or does not matter.

## Croatian

31. Calques. "od strane" passives become active ("tim je odlučio"). Light verb plus noun becomes the verb ("izvršiti uplatu" is "uplatiti"). Rewrite "na dnevnoj bazi" (svaki dan), "najbolji ikad", "napraviti smisla" (imati smisla), "na kraju dana" (naposljetku).
32. Announcers and openers. Delete "Važno je napomenuti", "U današnjem svijetu", "Nadam se da ste dobro".
33. No comma before i, ili, te. Sentence case. Decimal comma. A space before % and units (20 %, 5 kg).
34. Keep ti or vi as the text set it, with no drift mid-text, and no gender slashes.
35. Check for Serbian leakage: tačno (točno), hiljada (tisuća), bezbednost (sigurnost), sedmica (tjedan).
