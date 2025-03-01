/** Action so wallet can  */

import { z } from "zod";
import { injectable } from "inversify";
import { elizaLogger, type AgentRuntime } from "@elizaos/core";
import {
  elizaLogger,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
} from "@elizaos/core";
import {
  type ActionOptions,
  globalContainer,
  property,
} from "@elizaos-plugins/plugin-di";
import { BaseFlowInjectableAction } from "@elizaos-plugins/plugin-flow";
import { formater } from "../helpers";

/**
 * The generated content for the transaction proposer action
 */
export class TransactionProposerContent {
  @property({
    description: "The transaction code in Cadence language to be proposed",
    examples: [
      'import FungibleToken from 0xf233dcee88fe0abe\nimport FlowToken from 0x1654653399040a61\n\ntransaction(amount: UFix64, to: Address) {\n    let sentVault: @FungibleToken.Vault\n    prepare(signer: AuthAccount) {\n        let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)\n            ?? panic("Could not borrow reference to the owner\'s Vault!")\n        self.sentVault <- vaultRef.withdraw(amount: amount)\n    }\n    execute {\n        let receiverRef = getAccount(to)\n            .getCapability(/public/flowTokenReceiver)\n            .borrow<&{FungibleToken.Receiver}>()\n            ?? panic("Could not borrow receiver reference to the recipient\'s Vault")\n        receiverRef.deposit(from: <-self.sentVault)\n    }\n}',
    ],
    schema: z.string(),
  })
  transactionCode: string;

  @property({
    description: "Arguments for the transaction in JSON format",
    examples: [
      '[{"type":"UFix64","value":"10.0"},{"type":"Address","value":"0x1654653399040a61"}]',
    ],
    schema: z.string(),
  })
  arguments: string;

  @property({
    description: "A human-readable description of what the transaction does",
    examples: [
      "This transaction transfers 10 FLOW tokens to address 0x1654653399040a61",
    ],
    schema: z.string(),
  })
  description: string;
}

/**
 * The transaction proposer action options
 */
const actionOpts: ActionOptions<TransactionProposerContent> = {
  name: "PROPOSE_FLOW_TRANSACTION",
  similes: [
    "PROPOSE_TRANSACTION",
    "SUGGEST_TRANSACTION",
    "CREATE_TRANSACTION_PROPOSAL",
  ],
  description:
    "Call this action to propose a transaction on the Flow blockchain for the user to authorize",
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to propose a transaction to transfer 5 FLOW tokens to 0xa2de93114bae3e73",
          action: "PROPOSE_FLOW_TRANSACTION",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Create a transaction proposal to mint an NFT",
          action: "PROPOSE_FLOW_TRANSACTION",
        },
      },
    ],
  ],
  contentClass: TransactionProposerContent,
  suppressInitialMessage: true,
};

/**
 * Transaction Proposer action
 *
 * @category Actions
 * @description Proposes a transaction on the Flow blockchain for the user to authorize
 */
@injectable()
export class TransactionProposerAction extends BaseFlowInjectableAction<TransactionProposerContent> {
  constructor() {
    super(actionOpts);
  }

  /**
   * Validate if the action can be executed
   */
  async validate(
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State
  ): Promise<boolean> {
    const keywords: string[] = [
      "propose",
      "transaction",
      "suggest",
      "create",
      "flow",
    ];
    // Check if the message contains the keywords
    return keywords.some((keyword) =>
      message.content.text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Execute the transaction proposer action
   *
   * @param content the content from processMessages
   * @param callback the callback function to pass the result to Eliza runtime
   * @returns the transaction proposal response
   */
  async execute(
    content: TransactionProposerContent | null,
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    callback?: HandlerCallback
  ): Promise<void> {
    if (!content) {
      elizaLogger.warn("No content generated");
      return;
    }

    elizaLogger.log(`Starting ${this.name} handler...`);

    try {
      // Parse the transaction arguments
      let args;
      try {
        args = JSON.parse(content.arguments);
        if (!Array.isArray(args)) {
          throw new Error("Arguments must be an array");
        }
      } catch (e) {
        throw new Error(`Invalid arguments format: ${e.message}`);
      }

      // Validate the transaction code
      if (!content.transactionCode || content.transactionCode.trim() === "") {
        throw new Error("Transaction code cannot be empty");
      }

      // Create a transaction proposal
      const proposalId = `proposal-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // In a real implementation, you would store this proposal somewhere
      // for later authorization and execution

      // For now, we'll just log it and return a success message
      elizaLogger.log(`Created transaction proposal: ${proposalId}`);
      elizaLogger.log(`Transaction code: ${content.transactionCode}`);
      elizaLogger.log(`Arguments: ${content.arguments}`);
      elizaLogger.log(`Description: ${content.description}`);

      if (callback) {
        callback({
          text: `I've created a transaction proposal for you. Here's what it will do:\n\n${content.description}\n\nProposal ID: ${proposalId}\n\nYou can now authorize this transaction when you're ready.`,
          content: {
            success: true,
            proposalId,
            transactionCode: content.transactionCode,
            arguments: args,
            description: content.description,
          },
          source: "FlowBlockchain",
        });
      }
    } catch (e) {
      elizaLogger.error("Error creating transaction proposal:", e.message);
      callback?.({
        text: `Unable to create transaction proposal: ${e.message}`,
        content: {
          error: e.message,
        },
        source: "FlowBlockchain",
      });
    }

    elizaLogger.log(`Finished ${this.name} handler.`);
  }
}

// Register the transaction proposer action
globalContainer.bind(TransactionProposerAction).toSelf();
