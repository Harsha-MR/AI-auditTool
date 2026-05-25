## Day 1 — 2026-05-19
**Hours worked:** 3
**What I did:** Started by carefully reading the full assignment document and understanding the expectations beyond just coding. Researched similar AI spend optimization products and studied how SaaS audit tools present recommendations and savings reports. Finalized the project idea and decided to build an AI Spend Audit platform focused on AI subscriptions and API usage optimization. Planned the overall architecture, frontend pages, backend APIs, and required MVP features. Initialized the GitHub repository and set up the base Next.js + TypeScript project structure.
**What I learned:** Learned that the assignment prioritizes entrepreneurial thinking and explainable logic more than complex AI integrations. Also understood the importance of building deterministic audit logic instead of relying entirely on LLM outputs for financial calculations.
**Blockers / what I'm stuck on:** Initially struggled with how to design the optimization engine in a financially defensible way while keeping the implementation manageable within the deadline.
**Plan for tomorrow:** Research official AI tool pricing and start implementing the pricing data structure and rule-based audit engine.

## Day 2 — 2026-05-20
**Hours worked:** 5
**What I did:** Collected pricing information from official vendor websites including Cursor, ChatGPT, Claude, Gemini, and GitHub Copilot. Created the initial pricing schema and structured the data into reusable TypeScript objects. Started building the audit engine logic for identifying overspending, unnecessary enterprise plans, and alternative tools for different use cases. Implemented the first version of savings calculations and recommendation generation.
**What I learned:** Learned that many AI tools have overlapping capabilities but drastically different pricing structures. Also learned how important it is to clearly separate pricing logic from recommendation logic to keep the code maintainable and testable.
**Blockers / what I'm stuck on:** Some pricing models, especially API pricing, were difficult to normalize because vendors use different billing structures and terminology.
**Plan for tomorrow:** Build the frontend form flow and connect the audit engine to dynamic user inputs.

## Day 3 — 2026-05-21
**Hours worked:** 6
**What I did:** Developed the main spend input form and integrated state management for storing tool selections, pricing inputs, team size, and use cases. Added local storage persistence so users would not lose form progress after page refreshes. Created the audit results page UI and designed the savings summary section. Focused on making the interface clean, readable, and easy to screenshot or share publicly.
**What I learned:** Learned how important frontend UX is for tools that generate analytical reports. Small design decisions such as clearer spacing, highlighted savings values, and simplified recommendation cards significantly improved readability.
**Blockers / what I'm stuck on:** Faced hydration mismatch issues while syncing local storage data with server-rendered React components.
**Plan for tomorrow:** Fix hydration problems, improve responsiveness, and integrate AI-generated summaries using an LLM API.

## Day 4 — 2026-05-22
**Hours worked:** 5
**What I did:** Integrated the LLM-based personalized audit summary feature using API calls. Built fallback logic so the application could still generate summaries even if the API failed or rate limits were reached. Fixed hydration mismatches caused by local storage rendering differences between server and client. Improved the UI with dark theme support and optimized audit result cards for mobile responsiveness.
**What I learned:** Learned the importance of graceful fallback handling when working with external APIs. Also understood how hydration issues occur in React applications when browser-only features are accessed during server rendering.
**Blockers / what I'm stuck on:** The AI-generated summaries were always returning fallback responses due to incorrect payload formatting in the API request.
**Plan for tomorrow:** Debug the LLM integration issue and start implementing email capture and audit report communication flow.

## Day 5 — 2026-05-23
**Hours worked:** 6
**What I did:** Debugged and fixed the audit summary generation issue by correcting the API request structure and response handling logic. Implemented lead capture functionality with form validation and backend storage integration. Added transactional email support for sending audit summaries and report links to users. Reworked parts of the audit report UI and improved the form interaction flow.
**What I learned:** Learned how small payload mismatches can completely break third-party API integrations. Also learned more about transactional email workflows and backend communication patterns.
**Blockers / what I'm stuck on:** Email template rendering and variable injection were inconsistent during testing, especially while generating dynamic report content.
**Plan for tomorrow:** Improve email templates, add shareable public audit URLs, and begin writing automated tests for the audit engine.

## Day 6 — 2026-05-24
**Hours worked:** 5
**What I did:** Implemented shareable audit URLs and ensured private information such as company name and email were removed from public reports. Added Open Graph metadata support for better social sharing previews. Started writing automated tests for the audit engine logic, including savings calculations and plan recommendation validation. Improved overall code organization and refactored repetitive utility functions.
**What I learned:** Learned how important data sanitization is when exposing public shareable pages. Also improved my understanding of structuring reusable backend utility functions for testing and maintainability.
**Blockers / what I'm stuck on:** Testing dynamic recommendation logic became challenging because some rules depended on multiple overlapping conditions and edge cases.
**Plan for tomorrow:** Finish testing, documentation, deployment preparation, and performance optimizations.

## Day 7 — 2026-05-25
**Hours worked:** 7
**What I did:** Completed automated tests and finalized documentation files including architecture notes, pricing documentation, prompts, and reflections. Optimized frontend performance and fixed minor UI inconsistencies. Reviewed Lighthouse scores and improved accessibility issues. Performed final deployment checks, cleaned up unused code, verified environment variables, and reviewed the full user flow from audit generation to email delivery and shareable links.
**What I learned:** Learned how much time production-readiness tasks such as testing, documentation, accessibility, and deployment polishing actually require compared to initial feature development. Also realized the importance of structuring projects clearly for future maintainability.
**Blockers / what I'm stuck on:** Balancing feature completeness with polish and documentation quality within the submission timeline was challenging.
**Plan for tomorrow:** Final review of the repository, commit history cleanup, and submission preparation.
