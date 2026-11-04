# Where to look

Starting points for steps 4 and 5. A source is a page read this session, not an entry here.

## Official

- Context7 MCP: resolve the library id, then fetch docs for the topic. Try the exact package name first, then the vendor.
- Vendor documentation, release notes, changelog, pricing and plan-limit pages, status page.
- The repository at the installed version's tag: `git`, `README`, `CHANGELOG`, `docs/`, the file that implements the behaviour.
- Standards and specifications (RFCs, W3C, WHATWG, OWASP) when the question is about a protocol or a security rule.

## Peer apps

- GitHub search by topic, dependency or file name (`package.json` containing the library, a config file the feature needs).
- Curated lists: `awesome-*` repos, the framework's showcase pages, "built with" pages, the vendor's examples repository.
- Product directories: Product Hunt, AlternativeTo, OpenAlternative, G2 and Capterra for the closed products the open ones imitate.
- For each app: README, `docs/`, `ARCHITECTURE.md`, ADR folders, the PR or issue where the choice was made, the maintainers' blog and talks.
- Rank by stars, npm or PyPI downloads, commit recency, release cadence and who depends on it. Prefer apps of a similar size and stack.

## Practitioners

- YouTube: conference talks, maintainer walkthroughs, long-form reviews. `yt-dlp --skip-download --write-auto-sub --sub-lang en` gives the subtitles when the tool is installed.
- Engineering blogs of companies that run the option at scale, and of the maintainers themselves.
- GitHub issues and discussions on the option's own repository, sorted by reactions and comments.
- Stack Overflow (accepted and top-voted answers, with dates), Reddit (r/webdev, r/reactjs, r/nextjs, r/selfhosted, the product's subreddit), Hacker News (search by product name), Lobsters.
- Discord and Discourse archives when the vendor keeps them public; the vendor's community forum.
- Newsletters and podcasts from known voices in the area, for the reasoning behind their position.

## Weighing a source

Who wrote it and what they know. When it was written and for which version. Whether the claim is first-hand (they ran it) or repeated. Whether independent sources confirm it. A vendor's page is authoritative for its own behaviour and biased on comparisons; a competitor's comparison page is the reverse.
