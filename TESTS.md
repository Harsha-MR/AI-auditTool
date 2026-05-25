# Tests

## Automated tests
- src/lib/__tests__/audit.test.ts
  - Coverage: audit engine decision paths for downgrade, right-size, credit discounts, alternative switching, and keep-plan scenarios.
  - Cases:
    - Oversized plan downgrade with meaningful savings.
    - Seat count above team size results in right-size recommendation.
    - High spend triggers credits recommendation.
    - Cheaper alternative triggers switch recommendation.
    - No savings results in keep recommendation and zero total savings.

## Coverage notes
- Coverage tooling is not configured; these are focused unit tests for the audit engine only.
- UI, share page rendering, and email workflows are not covered by automated tests yet.

## How to run
```bash
npm test
```
