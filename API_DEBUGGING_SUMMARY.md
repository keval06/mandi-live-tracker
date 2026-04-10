# 🛠️ Mandi Tracker: API Debugging & Resilience Guide

A "no-nonsense" summary of the 10-record bug, the rate-limiting war, and the final architectural fix.

---

## 🛑 1. The Core Problems
1.  **The 10-Record Cap:** The Government API (`data.gov.in`) ignores the `limit` parameter. Even if you ask for 5,000, it only returns **10 records**.
2.  **Burst Sensitivity:** Sending too many parallel requests (e.g., 50 at once) triggers an instant **429 Too Many Requests** error and a temporary IP block.
3.  **Silent Failures:** The initial code didn't check `res.ok`, so when the API blocked us, the app silently returned 0 records instead of retrying.

---

## ⚠️ 2. The Errors
- **`429 Too Many Requests`**: The server is overwhelmed. This is the main reason pagination was "failing" for large states like Tamil Nadu.
- **`Total: 0` Error**: Caused when the initial "Total Count" fetch is blocked, leading the app to believe no records exist.

---

## 🚀 3. The Approach (The Fix)

### Level 1: Precise Pagination
Since the API only gives 10 records, we must use a math loop to calculate offsets:
`offset = 0, 10, 20, 30...`

### Level 2: "Backpressure" (Throttling)
We stopped blasting the API. We now use:
- **`BATCH = 2`**: Only two requests at a time.
- **`DELAY = 1000`**: A 1-second "breather" between batches.

### Level 3: Exponential Backoff (Resilience)
We implemented a `fetchWithRetry` helper. If the server says "I'm busy" (429), the code:
1.  **Waits** 2 seconds.
2.  **Retries**.
3.  If it fails again, it waits **4 seconds**, then **8 seconds**.

---

## 📈 4. The Final Logic Flow
1.  **Probe:** Fetch the first page to get the `total` count.
2.  **Plan:** Generate an array of all needed `offsets` (Total / 10).
3.  **Fetch:** Loop through offsets in small batches with a `sleep` delay.
4.  **Recover:** If any request hits a 429, back off and retry automatically.
5.  **Merge:** Combine all results into one master list for the UI.

---

## 🧪 5. How to Testify
Use the dedicated test suite to verify the logic without the UI:
```bash
node tests/mandi.test.js
