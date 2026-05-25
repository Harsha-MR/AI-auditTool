# LLM Prompts

## Audit summary prompt
System:
You are a finance analyst. Write around 100 words in a single paragraph with no bullet lists.

User:
Write a 90-110 word executive summary in a single paragraph with no bullet lists.

Company: {companyName}
Team size: {teamSize}
Primary use case: {primaryUseCase}
Region: {region}
Baseline spend: ${baselineSpendUsd}
Optimized target: ${optimizedSpendUsd}
Total savings: ${totalSavingsUsd}
Top recommendations: {toolLabel action (~savings)}

## Why this prompt
- Targets the ~100-word requirement while keeping the output scannable.
- Includes team size and use case so the LLM can contextualize recommendations.
- Uses explicit totals and top recommendations to avoid hallucinated numbers.

## What I tried that did not work
- A shorter, three-sentence prompt under-delivered on the ~100-word requirement.
- A bullet list format was less shareable in executive updates.
