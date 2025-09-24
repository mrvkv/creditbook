# Potential Issues and Risks

This document captures potential issues and risks identified during a quick analysis of the project. Each item references relevant files and symbols to facilitate remediation.

## Findings

- **Invalid React Native styles**
  - File: `stylesheets/modal.stylesheet.ts`
  - Details: Multiple style rules use `margin: "auto"` (e.g., in `button`, `text`, `radioButtonView`). React Native does not support `"auto"` for margins. Replace with `alignSelf: "center"` and explicit margins, or center children on the parent using `alignItems: "center"`.

- **Transaction ID counter inconsistency**
  - File: `services/database.service.ts`
  - Symbols: `DatabaseService.createUser()`, `DatabaseService.createTransaction()`
  - Details: `createUser()` inserts with `userId = counter + 1`, while `createTransaction()` inserts with `transactionId = counter` and then increments. This can make the first transaction ID `0` while user IDs start at `1`. Normalize both to the same approach (either insert at `counter + 1` or initialize counters to `1` and use `counter`).

- **Unused default in schema**
  - File: `constants/table.constant.ts`
  - Symbols: `Tables`, exported default schema object
  - Details: `users.balance` includes `default: 0`, but `QueryService.create()` builds column definitions only from `constraints` and `type`. The `default` field is unused and misleading, or the create logic should integrate defaults.

- **TypeScript version likely incompatible or unavailable**
  - File: `package.json`
  - Details: `devDependencies.typescript` is set to `"~5.8.3"`, which is not a published version as of now and may fail installation. Align with a known compatible version for Expo SDK 53 (e.g., `~5.6.3`) and verify with `npx expo doctor`.

- **Potential SDK/peer dependency misalignment**
  - File: `package.json`
  - Details: Versions `react: "19.0.0"`, `react-native: "0.79.5"`, and various Expo packages should be validated against Expo SDK 53. Use `npx expo install` to auto-resolve compatible versions and `npx expo doctor` to confirm.

- **Undefined users state and non-null assertion**
  - File: `app/index.tsx`
  - Symbols: `const [users, setUsers] = useState<IUser[]>();`, prop `users!` passed to `UserTable`
  - Details: State initializes as `undefined` then passed with a non-null assertion. Prefer `useState<IUser[]>([])` and pass the array directly to avoid potential runtime issues and improve type safety.

- **Navigation UX considerations**
  - File: `app/index.tsx`, `app/details.tsx`
  - Symbols: `router.replace()` usage for forward navigation and back navigation
  - Details: Using `replace` for forward navigation removes history, which can be unintuitive. Consider `router.push` to go to `details` and `router.back` for returning to the previous screen to preserve stack behavior.

- **Date formatting brittleness**
  - File: `components/TransactionTable.tsx`
  - Symbols: `formatDate()`
  - Details: Relies on `toLocaleDateString("en-GB")` and manual token replacement. This can vary by platform/locale. Consider `Intl.DateTimeFormat` with explicit options or a small formatting helper for stable output.

- **SQLCipher plugin usage implications**
  - File: `app.json`
  - Symbols: `plugins -> expo-sqlite -> { useSQLCipher: true }`
  - Details: Enabling SQLCipher increases app size and may impact performance. If encryption-at-rest isn’t required, consider disabling to reduce footprint and complexity.

- **Empty README and limited contributor guidance**
  - File: `README.md`
  - Details: The README is empty. Add setup instructions, scripts, environment notes, and a brief architecture overview to aid onboarding.

- **Linting/formatting coverage**
  - Files: `eslint.config.js`, general project
  - Details: ESLint is present but minimal configuration. Consider integrating Prettier and adding scripts like `type-check`, `lint`, and possibly a pre-commit hook.

## Recommended Next Steps

1. Replace invalid `margin: "auto"` usages in `stylesheets/modal.stylesheet.ts` with valid RN layout properties.
2. Normalize counter handling in `DatabaseService` and `QueryService` (decide on `counter + 1` vs. initializing counters to `1`).
3. Adjust `typescript` to a compatible version and align dependencies with `npx expo install`; verify with `npx expo doctor`.
4. Initialize `users` with an empty array in `app/index.tsx` and remove non-null assertions.
5. Review navigation: use `router.push` for forward and `router.back` for returning where appropriate.
6. Refactor date formatting for stability across locales.
7. Reassess the need for SQLCipher; disable if unnecessary.
8. Populate `README.md` with setup, run, and build instructions.
9. Expand linting/formatting rules and add related scripts.
