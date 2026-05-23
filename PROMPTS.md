# LLM Prompts

## Audit summary prompt
System:
You are a finance analyst. Provide a crisp executive summary without bullet lists.

User:
Summarize this AI spend audit in 3 concise sentences.

Company: {companyName}
Team size: {teamSize}
Primary use case: {primaryUseCase}
Region: {region}
Baseline spend: ${baselineSpendUsd}
Optimized target: ${optimizedSpendUsd}
Total savings: ${totalSavingsUsd}
Top recommendations: {toolLabel action (~savings)}

## Why this prompt
- Keeps the summary to three sentences for executive readability.
- Includes team size and use case so the LLM can contextualize recommendations.
- Uses explicit totals and top recommendations to avoid hallucinated numbers.

## What I tried that did not work
- A longer, multi-paragraph prompt produced verbose output and repeated numbers.
- A bullet list format was less shareable in executive updates.
