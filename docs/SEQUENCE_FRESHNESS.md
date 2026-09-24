# Sequence Number Freshness

## The Problem

Any read-only tool that reports an account's current sequence number can show a value that's already stale by the time a user acts on it, if the account submits another transaction in between. This race condition is inherent to the read-only design: Utix never signs or submits, so it cannot guarantee that a sequence number is still valid when used.

This can lead to confusing transaction failures ("Why was my transaction rejected as `tx_bad_seq`?") even though Utix correctly reported the sequence at the time of display.

## Why This Matters

Sequence numbers are used for:
1. **Transaction previews** — showing what the next transaction will look like
2. **Bump-sequence inspection** — calculating fee-bump targets
3. **Preconditions validation** — checking minSequenceNumber constraints
4. **Account state snapshots** — understanding account configuration

In all cases, the displayed value is a point-in-time snapshot, not a guarantee.

## How Utix Handles It

### Display Strategy

Every sequence number display includes:

1. **Timestamp** — the ledger or time it was retrieved
2. **Advisory copy** — clear warning that the value can be stale
3. **Refresh action** — manual "re-check now" button (where applicable)

### Example Display

```
Current sequence: 4370426197114881
Sequence last changed in ledger: 50123456

⚠ Sequence may be stale
   Sequence number is current as of the ledger shown above, but it can
   change if the account submits another transaction. Re-check before
   using this value to build a real transaction.

[Refresh] [Inspect another account]
```

### Features Affected

The following features display sequence numbers and include advisories:

- **Sequence Inspector** — direct sequence lookup; includes refresh button
- **XDR Inspector** — decodes envelope sequence; includes advisory that this is the encoded value, not current
- **Fee-bump Inspector** — references source sequence; includes advisory
- **Preconditions Explainer** — references minSequenceNumber; includes advisory
- **SEP-10 Inspector** — decodes challenge sequence; includes advisory

## Acceptance Criteria (Issue #33)

- ✅ Every displayed account sequence number is labeled with ledger or time retrieved
- ✅ Manual refresh action available wherever sequence feeds into decoding/preview
- ✅ Advisory copy consistent across all slices
- ✅ Docs explain why freshness cannot be guaranteed

## Best Practices for Users

1. **Always re-check** before submitting a real transaction
2. **Note the ledger** when you take a snapshot
3. **Be aware of timing** if many seconds pass between inspection and submission
4. **Use refresh** to get the latest value if you're unsure

## Limitations

Utix **cannot** and **does not**:

- Pre-sign transactions (still read-only)
- Reserve sequence numbers
- Guarantee delivery timing
- Monitor accounts for changes
- Predict future sequence values

These are architectural constraints, not bugs. They are why Utix is trustworthy: it makes no claims it cannot keep.
