# Reflection

## 1. Hardest bug and how you debugged it
The hardest bug I faced during this project was related to audit result persistence and shareable public URLs. Initially, users could successfully generate audits and see the correct recommendations and savings calculations. However, after refreshing the page or opening the generated public URL in another browser session, parts of the audit data would either disappear or display incorrectly.

At first, I suspected the issue was related to frontend state management because the problem only appeared after reloads. I checked React state synchronization and local storage handling, but those systems appeared to work properly. My second hypothesis was that the backend was not storing audit objects correctly in the database. I manually inspected the stored data in Supabase and confirmed that the records themselves were accurate.

To isolate the problem, I added detailed logging throughout the application flow, tracing the data from frontend form submission to backend insertion, API retrieval, and final rendering. After debugging each stage step by step, I discovered that the issue came from inconsistent naming conventions between the backend API responses and frontend rendering logic. Some components expected fields like `monthlySavings` while other parts expected `monthly_savings`.

Because of this mismatch, certain values became undefined during rendering after hydration. I fixed the issue by standardizing all API response structures and creating shared TypeScript interfaces across both frontend and backend codebases. This bug taught me how important consistent contracts and strict typing are when multiple systems interact dynamically.

## 2. A decision you reversed mid-week
One major decision I reversed during development was using AI-generated recommendations directly for the audit engine logic. At the start of the project, I believed using an LLM to dynamically generate optimization suggestions would make the tool feel smarter and more advanced. My initial approach involved sending user spending data to an AI model and asking it to generate recommendations about cheaper plans and alternative AI tools.

However, after testing several audit cases, I realized the responses were inconsistent and sometimes financially inaccurate. In some situations, the AI recommended plans that were actually more expensive than the user’s current setup. In other cases, it misunderstood the use case entirely or hallucinated pricing information that did not match official vendor pricing pages.

After revisiting the assignment instructions, I noticed an important statement explaining that hardcoded rules were the correct approach for audit calculations and that understanding when not to use AI was part of the evaluation. That completely changed my direction. I redesigned the system into a deterministic rule-based audit engine backed by verified pricing data and manually designed optimization rules.

Instead of relying on AI for calculations, I used AI only for generating personalized summary paragraphs after the audit was completed. This reversal significantly improved the reliability, explainability, and testability of the product. It also made the recommendations more trustworthy because every savings calculation could be traced back to explicit pricing logic and business rules.

## 3. What you would build in week 2
If I had another week to continue developing this product, I would focus on turning the MVP into a more scalable and data-driven SaaS platform. The first major improvement would be integrating real billing and usage data directly from AI vendors instead of relying entirely on manually entered spending information. Integrations with OpenAI APIs, Anthropic billing APIs, or Stripe invoice imports would allow users to generate audits automatically using real subscription and usage data.

The second major feature I would add is benchmarking intelligence. Instead of only showing optimization suggestions, the platform could also show how a company compares to similar teams. For example, users could see metrics such as “companies with 10–20 developers spend an average of $X per developer on AI tools.” This would make the audit reports more contextual and valuable.

I would also improve the optimization engine by introducing weighted scoring systems for different use cases such as coding, writing, research, and data analysis. Rather than static recommendations, the system could generate more personalized optimization paths based on capability-to-cost efficiency.

From a growth perspective, I would focus heavily on virality and lead generation. Features such as downloadable PDF reports, referral systems, benchmark badges, and embeddable audit widgets could significantly improve organic sharing and distribution.

From an engineering perspective, I would add caching layers, background job queues, analytics dashboards, and more comprehensive automated tests to support larger traffic volumes and improve production reliability.

## 4. How you used AI tools
I used several AI tools throughout this project, mainly Claude Sonnet 4.6 and GPT-5.2 Codex. Claude was primarily used for brainstorming architecture ideas, discussing optimization strategies, refining business logic, and planning the overall workflow of the audit engine. It helped me think through how to structure pricing comparisons, define recommendation rules, and create explainable optimization logic.

GPT-5.2 Codex was mainly used during implementation and development tasks. It helped generate frontend React components, backend API scaffolding, utility functions, TypeScript interfaces, and repetitive boilerplate code. It was particularly useful for speeding up development workflows and improving productivity while working across multiple frontend and backend files.

However, I was careful not to trust AI blindly, especially for financial calculations and pricing recommendations. All pricing data was manually verified from official vendor pricing pages, and all audit calculations were implemented using deterministic business rules rather than AI-generated reasoning. I specifically avoided allowing AI to directly determine financial optimization outcomes because inaccuracies could significantly reduce user trust.

One important example where AI failed occurred when an LLM incorrectly recommended enterprise-level plans for smaller teams without considering actual pricing efficiency. After reviewing those incorrect recommendations, I decided to redesign the audit engine using hardcoded optimization rules instead of probabilistic AI outputs. This experience reinforced the importance of understanding when traditional engineering approaches are more reliable than generative AI systems.

## 5. Self-ratings (1-10)
### Discipline — 8/10
I maintained consistent progress across the development timeline, documented daily work, and avoided last-minute cramming. While there were some days where debugging slowed progress, I stayed committed to shipping a complete product within the deadline.

### Code Quality — 7/10
I focused on modular code organization, reusable utility functions, and TypeScript-based structure. There is still room for improvement in testing coverage and deeper abstraction layers, but the overall architecture is maintainable and scalable for an MVP.

### Design Sense — 7/10
I prioritized clarity, readability, and shareability in the UI rather than building an overly complex interface. The audit results page and savings summaries were designed to feel screenshot-friendly and understandable to non-technical users.

### Problem-Solving — 8/10
Several issues involving hydration mismatches, API fallback handling, and recommendation logic required systematic debugging and iterative thinking. I believe I handled ambiguity and technical blockers effectively throughout the project.

### Entrepreneurial Thinking — 8/10
I approached the project not only as a coding assignment but also as a realistic lead-generation SaaS product. I focused on user trust, explainable financial recommendations, growth loops through shareable reports, and the business value Credex could gain from the tool.
