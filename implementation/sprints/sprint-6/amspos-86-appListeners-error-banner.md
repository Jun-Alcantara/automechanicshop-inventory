# AMSPOS-86: AppListeners Error Banner

**Sprint**: Sprint 6 — Zustand Stores
**Effort**: 0.5 day
**Dependencies**: AMSPOS-41 (inventoryStore), AMSPOS-42 (catalogStore), prior settingsStore
**Phase**: Foundation

---

## Description

Update `src/components/layout/AppListeners.tsx` to render a non-blocking error banner at the top of the screen when any store has a non-null `error` field. The banner informs the user that data may be outdated without interrupting the UI flow.

---

## Instructions

### 1. Update `src/components/layout/AppListeners.tsx`

Add the following after the existing subscription `useEffect`:

```typescript
// Select error fields from each store
const inventoryError = useInventoryStore((s) => s.error);
const catalogError = useCatalogStore((s) => s.error);
const settingsError = useSettingsStore((s) => s.error);

const hasError = !!(inventoryError || catalogError || settingsError);

return hasError ? (
  <View style={styles.errorBanner}>
    <Text style={styles.errorText}>
      Data sync error. Some information may be outdated.
    </Text>
  </View>
) : null;
```

### 2. Add styles

Add to the component's `StyleSheet.create({...})`:

```typescript
errorBanner: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  backgroundColor: Colors.dangerLight,
  paddingVertical: 6,
  paddingHorizontal: 16,
  alignItems: 'center',
},
errorText: {
  color: Colors.dangerDark,
  fontSize: 13,
  fontWeight: '500',
},
```

### Notes

- The banner is **non-blocking** — it overlays content via `position: 'absolute'` and `zIndex`, does not push layout down.
- `Colors.dangerLight` and `Colors.dangerDark` should come from the project's color constants file (e.g. `src/constants/colors.ts`). Adjust if the token names differ.
- If `AppListeners` currently returns `null` unconditionally, change its return type from `null` to `React.ReactElement | null`.
- The existing subscription `useEffect` (which calls `subscribe()`/`unsubscribe()` on stores) must remain untouched.

---

## Acceptance Criteria

- [ ] When all store `error` fields are `null`, component returns `null` (no banner rendered)
- [ ] When any store `error` is non-null, the error banner is visible at the top of the screen
- [ ] Banner does not block or shift existing UI content
- [ ] Banner uses `Colors.dangerLight` background
- [ ] No TypeScript errors

## Definition of Done

- Acceptance criteria met
- File committed to `main`
