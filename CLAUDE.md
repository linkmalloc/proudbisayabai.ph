# Monthly Facebook Follower Count Maintenance

**Scheduled task** — runs monthly, no one is watching. Surface results via `PushNotification`.

## Steps

1. Read `_data/ads.json`. Note the current value at `followers.facebook` (e.g. "504,000"). Parse to integer.

2. Use WebFetch on **`https://web.facebook.com/proudbisayabai`** with the prompt:
   > "What is the current follower count or 'people who like this page' count for this Facebook page? Reply with just the number or 'unknown' if you cannot find it."

   `web.facebook.com` serves content without requiring authentication. If the result is "unknown", a login redirect, no number found, or anything ambiguous, treat the scrape as **FAILED** and skip to step 5.

3. Parse the returned value. Handle formats: `"504K"` → 504000, `"504,000"` → 504000, `"504 thousand"` → 504000. Round to nearest thousand.

4. Decide:
   - If new count is **within 1,000** of stored count: do nothing, exit cleanly. No PR, no issue.
   - If new count is **more than 10,000 smaller** than stored count: treat as scrape error, skip to step 5.
   - Otherwise **update `_data/ads.json`**:
     - Set `followers.facebook` to the new value formatted with commas (e.g. `"512,000"`).
     - If the new count crosses a 10k tier, update `article.sub_title` to `"Reach over Xk people with your brand"` where X is the new count rounded **down** to nearest 10k (e.g. 512k → "510k", 519k → "510k", 520k → "520k"). If not crossed, leave `sub_title` alone.
   - Create a new branch named `bot/fb-follower-update-YYYY-MM` using the current year-month.
   - Commit with message `"Update Facebook follower count to NNNk"` (round to nearest 1k for the message).
   - Push the branch and open a PR via GitHub MCP tools against `master`. Title: same as commit. Body: one-line summary of old → new count.
   - **NEVER push directly to master.**

5. **SCRAPE FAILED path**: Open a GitHub issue via GitHub MCP tools. Title: `"Manual update needed: Facebook follower count"`. Body must include: today's date, the currently stored value, a note that automatic scraping was blocked, and a link to `https://www.facebook.com/proudbisayabai` for manual lookup. **Do NOT modify any files in this path.**

## Constraints

- Do not push to master. Always use a PR.
- Do not edit any file other than `_data/ads.json`.
- If anything is ambiguous, prefer the issue path (step 5) over writing a wrong number.
- Use `PushNotification` to notify the owner of the outcome (success, update, or scrape failure).
- Use GitHub MCP tools (`mcp__github__*`) for all GitHub interactions — `gh` CLI is not available.
