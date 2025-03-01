# Transaction Roles Pluign

This package implements the Flow blockchain transaction model for the Eliza agent framework, allowing agents to interact with the Flow blockchain through a multi-role transaction process.

## Overview

The Flow blockchain uses a unique multi-role transaction model that separates the responsibilities of transaction creation, authorization, and payment. This separation provides enhanced security, flexibility, and composability compared to traditional blockchain transaction models.

This implementation provides three key actions that map to the Flow transaction roles:

1. **Transaction Proposer** (`tx-proposer.ts`)
2. **Transaction Authorizer** (`tx-authorizer.ts`)
3. **Transaction Payer** (`tx-payer.ts`)

## Transaction Roles Explained

### Transaction Proposer

The Transaction Proposer is responsible for creating and proposing transactions. This role:

- Defines the transaction logic using Cadence code
- Specifies the transaction arguments
- Provides a human-readable description of the transaction's purpose
- Creates a unique proposal ID for tracking

**File**: `tx-proposer.ts`

### Transaction Authorizer

The Transaction Authorizer is responsible for reviewing and authorizing transactions. This role:

- Verifies the transaction proposal is valid
- Authorizes (or rejects) the transaction using the account's keys
- Creates an authorization ID for the approved transaction
- Ensures only approved transactions can proceed to execution

**File**: `tx-authorizer.ts`

### Transaction Payer

The Transaction Payer is responsible for paying the gas fees and executing the transaction. This role:

- Sets the gas limit for the transaction
- Pays for the transaction execution using FLOW tokens
- Submits the fully signed transaction to the blockchain
- Monitors the transaction status and reports the result

**File**: `tx-payer.ts`

## Value for Flow and Eliza

### For Flow Blockchain

- **Increased Adoption**: By making it easier to interact with Flow, more users and developers can participate in the ecosystem.
- **Showcases Unique Features**: Demonstrates the advantages of Flow's multi-role transaction model.
- **Enhanced Security**: Promotes best practices for secure transaction handling.

### For Eliza Framework

- **Blockchain Integration**: Provides a robust way for Eliza agents to interact with the Flow blockchain.
- **Advanced Capabilities**: Enables agents to perform complex blockchain operations on behalf of users.
- **Flexible Architecture**: The modular design allows for easy extension and customization.

## Use Cases

### User-Friendly Wallet Management

Agents can help users manage their Flow wallets by:

- Proposing transactions based on natural language requests
- Explaining transaction details before authorization
- Handling gas payments automatically

### Automated DeFi Operations

Agents can automate DeFi operations by:

- Proposing token swaps, liquidity provision, or yield farming strategies
- Requesting authorization for significant financial transactions
- Optimizing gas payments based on network conditions

### NFT Management

Agents can assist with NFT operations by:

- Proposing NFT minting, transfers, or marketplace listings
- Securing authorization for high-value NFT transactions
- Paying for gas fees during high-demand NFT drops

### Enterprise Workflows

Organizations can implement approval workflows by:

- Having different departments handle different transaction roles
- Implementing multi-signature authorization processes
- Centralizing gas payments while distributing authorization

## Architecture

The transaction model is implemented as a set of action handlers within the Eliza agent framework:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Transaction   │     │   Transaction   │     │   Transaction   │
│    Proposer     │────▶│   Authorizer    │────▶│     Payer       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Proposal ID    │     │Authorization ID │     │ Transaction ID  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

Each action:

1. Extends the `BaseFlowInjectableAction` class
2. Implements validation logic to determine when it should be triggered
3. Executes the appropriate Flow blockchain operations
4. Returns structured responses to the Eliza runtime

The actions use the `AccountsPoolService` to interact with Flow accounts and the Flow blockchain API.

## Getting Started

To install the plugin, use the following commands in your Eliza project:

```bash
npx elizaos plugins add @elizaos-plugins/plugin-di
npx elizaos plugins add @elizaos-plugins/plugin-flow
npx elizaos plugins add @elizaos-plugins/plugin-flow-advanced
```

The plugin requires the following environment variables to be set in your `.env` file:

```bash
# Flow Blockchain Configuration
FLOW_ADDRESS=0x3098231afe5ea214
FLOW_PRIVATE_KEY=5d4dc9a4a6f50d734c5d39793fce09eda416b50ab34038b809f2d278ff9d5116
FLOW_NETWORK=testnet      # Optional: mainnet, testnet, or emulator (defaults to mainnet)
FLOW_ENDPOINT_URL=https://rest-testnet.onflow.org      # Optional: Custom RPC endpoint URL
```

Example conversation flow:

```
User: "Gimme the most degenerate memecoins about cats"
Agent: [Uses TransactionProposer] "I've created a proposal to transfer 10 FLOW for 100 DegenCat. Proposal ID: proposal-123..."
User: "Let's ape into it"
Agent: [Uses TransactionAuthorizer] "Kinda cringe tbh but here you go. Authorization ID: auth-456..."
Agent: [Uses TransactionPayer] "Transaction executed successfully. Transaction ID: tx-789..."
```
