# Cook Bro

A customizable household meal planner for Indian kitchens, with regional Indian and home-friendly international recipes. Plan tomorrow, swap dishes, combine ingredient quantities, and share a cook sheet through ordinary WhatsApp.

## Features

- 146 original recipe adaptations: breakfast, dal, curries, vegetable sides and staples.
- Vegetarian, vegetarian with eggs, or mixed diets; cuisine selections, ingredient exclusions and common allergen filters.
- Household composition and adjustable cooking servings. Children’s needs are separate from adult weight-loss goals.
- Weekly curry proteins, rice/roti/paratha staples, optional dal and sides, and one curry batch for lunch and dinner.
- A configurable 3–20 day repeat exclusion. The default is seven days; the planner also prefers dishes not used in the previous 20 days. Staples are exempt. The same curry can cover both meals on one day. Narrow choices can exhaust the catalogue and produce an actionable error.
- Whole-dish alternatives, informational ingredient substitutions, a combined shopping list, and pantry checks.
- Ad hoc order-in meals: selecting one removes its home ingredients and adjusts the shared batch. Order ideas, a checkout-budget calculator and links to Zomato.
- Manual WhatsApp sharing, copyable messages, print sheets, optional recipient numbers and a preferred sharing time. **No automatic messages or reminders.**
- Installable web app on iPhone, iPad and Mac, with authenticated online persistence across devices.

## Personalize your household

Open **Household**, choose your preferences, and select **Save & refresh drafts**. Public defaults are two adults, vegetarian food, all cuisines, a seven-day repeat window, and no delivery address or phone numbers. There is no embedded personal household profile.

Controls include adults, seniors, children’s ages, cooking servings, diet, cuisines, allergens, ingredients to avoid, daily curry proteins, shared versus separate curries, staples, dal, sides, repeat interval, Hindi/English dish names, oil, added salt, locality, PIN code, family-order budget, weekly order-in target, time zone and sharing time. Phone numbers and occasional mutton have a separate save button.

Saving preferences refreshes future unconfirmed menus. Confirmed menus retain their saved quantities and preferences. Unlock and generate a new menu to use new choices. Recipe quantities are starting cooking amounts, not prescribed individual portions.

The catalogue currently contains no beef, pork, sweets or added-sugar recipes. Those are catalogue boundaries, not hidden user preferences. Extend `lib/food.ts` to add other dishes. Ingredient substitutions are suggestions; use a whole-dish swap to recalculate shopping automatically. Restaurant ideas are not allergy-filtered.

## Run locally

Requires Node.js 22.13 or later and npm. Dependencies are resolved in `package-lock.json`.

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_strange_magus.sql
npm run dev -- --port 5173
```

Open `http://localhost:5173`. The bundled Sites Vite plugin provides a localhost-only mock sign-in. It strips supplied identity headers and only accepts loopback requests. This is development authentication, not a production login provider.

The SQL initialization step is for a new local database. Skip it on later starts; do not reapply an already-applied migration. Future schema changes should use new versioned migrations.

Production builds live in `dist/server` and `dist/client`. The API needs the D1 binding `DB`. The public `.openai/hosting.json` declares the binding but intentionally has no private site project ID.

### Deploying your own copy

This application currently uses the Sites trusted authentication gateway. Register your own site, set its returned project ID in `.openai/hosting.json`, provision the `DB` binding, apply the bundled migration, and deploy the compiled Worker and client assets through that gateway. Never reuse another deployment’s project ID or database.

For other hosting providers, replace `app/chatgpt-auth.ts` with a verified server-side session integration before public deployment. **Do not expose this Worker directly while trusting caller-supplied `oai-authenticated-user-*` headers.** The current production authentication boundary is the Sites gateway; the localhost mock is not present in the production Worker.

An optional server-only `COOKBRO_INITIAL_PREFERENCES` variable accepts JSON matching `preferencesSchema` in `lib/preferences.ts`. Use it for a private deployment’s initial household defaults. Set it as a secret in the host environment, never as a frontend variable or committed file. It applies to new households or old profiles without saved preferences; saved settings take precedence. `.env*`, `.dev.vars*`, database files and runtime directories are ignored.

### Apple devices

On iPhone or iPad, open your deployed HTTPS app in Safari and use **Share → Add to Home Screen**. On macOS Sonoma or later, use **File → Add to Dock**. Sign in with the same account on each device. An internet connection is required for household data. The service worker caches only a generic offline page, not menus, preferences or authenticated responses. This is a web app, not a native App Store application.

## Zomato integration status

Cook Bro does not log in to Zomato, read order history, scrape private endpoints or place orders. We could not verify a free official consumer OAuth/order-history API. Zomato’s documented integration is for approved restaurant POS partners, with onboarding prerequisites:

- [Official partner prerequisites](https://www.zomato.com/developer/integration/docs/getting-started/prerequisites/)
- [Official order-management documentation](https://www.zomato.com/developer/integration/docs/api-documentation/order-management/)

The built-in examples reference published restaurant menus around Bengaluru’s Sarjapur Road. That locality receives direct restaurant links; other locations receive generic basket ideas and the Zomato homepage. Availability, pricing, delivery area and restaurant portions must be checked at checkout. The app never claims a basket is under budget until the user enters the cart subtotal and all fees. These are examples, not a live restaurant search.

## Validation

```sh
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/esbuild tests/planner.test.ts --bundle --platform=node --outfile=/tmp/cookbro-tests.cjs
node /tmp/cookbro-tests.cjs
node tests/api.test.mjs
npm run build
```

Planner tests exercise 180 daily menus, protein frequency, repeat exclusion, shared batches, substitutions through swaps, dietary filters, scaled quantities and order-in removal. API tests cover authentication, origin checks, validation, locks, preference snapshots, persistence and stale-write rejection. API tests are restricted to localhost, change local preferences temporarily and leave a draft menu 20 days ahead. `COOKBRO_TEST_URL` selects another local port.

See [architecture.md](architecture.md) for HLD, LLD, data structures, security boundaries and extension points.

## Food guidance and credits

This is general meal-planning software, not a medical diet. No calorie, carbohydrate or sodium totals are calculated. Recipes have not been independently kitchen-tested or clinically reviewed. Check packaging, substitutions and cross-contact for allergies. Batch cooking requires prompt refrigeration and thorough reheating.

Guidance sources: [American Diabetes Association](https://diabetes.org/food-nutrition/meal-planning), [WHO healthy diet](https://www.who.int/news-room/fact-sheets/detail/healthy-diet), [FDA cooked-food storage](https://www.fda.gov/food/buy-store-serve-safe-food/serving-safe-buffets).

Photo: [“Fish And Rice” by শক্তিশেল](https://commons.wikimedia.org/wiki/File:Fish_And_Rice.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), cropped in the interface. Vendored Sites Vite plugin retains its upstream MIT license in `build/sites-vite-plugin.LICENSE`.
