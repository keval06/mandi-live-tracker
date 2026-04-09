# 🌾 Mandi Tracker: Master Core Logic Guide

This guide is designed for deep learning and teaching. It breaks down the **Mandi Tracker** project file-by-file, focusing on the "Why" and "How" of the core logic.

---

## 🏗️ 1. The Data Engine (`lib/api/`)
This is the heart of the application. It interacts with the `data.gov.in` API.

### `mandi.js` — The Fetcher
*   **The Problem:** The API has a limit per request, but there are ~18,000 nationwide records.
*   **The Logic:** 
    *   `fetchAllPages()` uses `Promise.all` to trigger multiple parallel requests. It calculates how many pages exist, creates an array of offsets, and fetches them all at once for maximum speed.
    *   `filterByRange()` handles date selection ("Today", "This Week", etc.) by parsing the API's string date format (`dd/mm/yyyy`).
*   **Key Concept:** **Parallel Pagination**. Instead of fetching one by one, we fetch all in parallel to populate the dashboard instantly.

### `utils.js` — The Normalizer
*   **The Problem:** Raw API data is often inconsistent (missing fields, strings instead of numbers).
*   **The Logic:**
    *   `normalizeRecord()`: Acts as a "Gatekeeper." It ensures every record has the same structure (`arrivalDate`, `modalPrice`, etc.) and provides fallbacks.
    *   `formatRupee()`: Handles Indian currency formatting with the `en-IN` locale.
    *   `topCommoditiesByPrice()`: Groups records and calculates averages to find the most expensive or popular items.
*   **Key Concept:** **Data Integrity**. Never use raw API data directly in components; always pass it through a normalizer first.

---

## 🧠 2. The Orchestrator (`app/`)
Next.js App Router files that manage page-level state and data flow.

### `page.js` — Main Dashboard
*   **Logic:** Uses **React Server Components (RSC)**. It fetches data on the server, filters it based on URL `searchParams`, and passes it down to components.
*   **Feature:** `buildTrendData()` transforms thousands of records into a small array specifically formatted for the Recharts library.

### `layout.js` & `globals.css`
*   **Logic:** Sets the global font (Inter) and provides the container for the entire app.

---

## 🎨 3. UI Building Blocks (`components/`)
Highly reusable components that focus on presentation.

### `FilterBar.jsx`
*   **Concept:** State Management via URL.
*   **Logic:** When you change a state or category, it updates the URL query string. This triggers a server-side re-fetch, keeping the UI in sync with the URL.

### `TrendChart.jsx`
*   **Logic:** Uses `recharts`. It dynamically switches between a **Line Chart** (if there's a trend) and a **Bar Chart** (if there's only one day of data).

### `PriceTable.jsx`
*   **Logic:** Implements a client-side search filter. It allows users to search through the thousands of records fetched by the server without making new API calls.

### `PriceCard.jsx` & `TopMovers.jsx`
*   **Logic:** These extract "Insights" from the data. 
    *   `PriceCard` focuses on a single commodity spotlight.
    *   `TopMovers` identifies commodities with the highest "Spread" (price volatility).

---

## 🚀 4. The Workflow (The "Never-Forget" Summary)

1.  **Request:** User opens the page with `?state=Punjab`.
2.  **Fetch (`mandi.js`):** Server triggers parallel API calls for Punjab data.
3.  **Process (`utils.js`):** Records are normalized into cleaner objects.
4.  **Compute (`page.js`):** Averages and trends are calculated on the fly.
5.  **Render:** Next.js sends the final HTML to the user and hydrates the interactive charts.

---

### 💡 Pro Tip for Teaching
Focus on **`lib/api/utils.js`**. In real-world projects, data is messy. The ability to write clean utility functions that transform raw data into a usable UI model is the mark of a senior developer.
