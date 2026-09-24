# Stellar Basics

This page explains the Stellar concepts used by RevyHubX.

## Public Keys

Stellar public account IDs start with `G`. They are safe to share and are the only account identifiers this app accepts. Secret keys and seed phrases should never be entered into this app.

## Testnet and Mainnet

Testnet is for development and resets periodically. Testnet XLM has no market value and can be requested through Friendbot.

Mainnet is the live Stellar network. The app can query mainnet Horizon for balances, trustlines, and transactions, but the faucet remains testnet-only.

## Horizon

Horizon is Stellar's HTTP API. This project uses Horizon to load account balances, trustlines, and transaction summaries.

## Native XLM

XLM is Stellar's native asset. It does not have an issuer address.

## Issued Assets and Trustlines

Issued assets have an asset code and an issuer account. A Stellar account must create a trustline before it can hold most issued assets.

The Trustline Checker asks for:

- Account address
- Asset code
- Issuer address

## Transactions

Transactions are identified by 64-character hexadecimal hashes. The Transaction Lookup tool validates the hash shape before querying Horizon and links to Stellar Expert for deeper inspection.

## Sequence Numbers

An account's sequence number can change the instant another transaction from
that account is submitted. Because this project is read-only and never signs
or submits anything, it cannot guarantee that a sequence number it shows you
is still current by the time you use it elsewhere — it can only report what
Horizon returned at fetch time. Tools that display a sequence number label it
with the time it was fetched and offer a refresh action; re-check the value
immediately before relying on it to build a transaction.

## Wallets

Freighter is the only browser wallet this project currently detects and connects to. This project only requests a public key and network information. It does not request signatures, secret keys, or transaction submission.

Because extensions inject their API into the page asynchronously, detection retries for a short bounded window after the page loads instead of checking only once. If Freighter is not found after that window, the page reports it as not installed; use the refresh action once the extension has finished loading or after installing it.
