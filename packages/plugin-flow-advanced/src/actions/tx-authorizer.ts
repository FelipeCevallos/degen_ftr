import { z } from "zod";
import { inject, injectable } from "inversify";
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
import { AccountsPoolService } from "../services/acctPool.service";

/**
 * The generated content for the transaction authorizer action
 */
export class TransactionAuthorizerContent {
  @property({
    description: "The proposal ID of the transaction to authorize",
    examples: ["proposal-1234567890-123"],
    schema: z.string(),
  })
  proposalId: string;

  @property({
    description: "Whether to authorize the transaction or reject it",
    examples: ["true", "false"],
    schema: z.boolean(),
  })
  authorize: boolean;
}

/**
 * The transaction authorizer action options
 */
const actionOpts: ActionOptions<TransactionAuthorizerContent> = {
  name: "AUTHORIZE_FLOW_TRANSACTION",
  similes: [
    "AUTHORIZE_TRANSACTION",
    "APPROVE_TRANSACTION",
    "SIGN_TRANSACTION",
    "REJECT_TRANSACTION",
  ],
  description:
    "Call this action to authorize or reject a previously proposed transaction on the Flow blockchain",
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to authorize the transaction proposal-1234567890-123",
          action: "AUTHORIZE_FLOW_TRANSACTION",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Reject the transaction proposal-1234567890-123",
          action: "AUTHORIZE_FLOW_TRANSACTION",
        },
      },
    ],
  ],
  contentClass: TransactionAuthorizerContent,
  suppressInitialMessage: true,
};

/**
 * Transaction Authorizer action
 *
 * @category Actions
 * @description Authorizes a previously proposed transaction on the Flow blockchain
 */
@injectable()
export class TransactionAuthorizerAction extends BaseFlowInjectableAction<TransactionAuthorizerContent> {
  constructor(
    @inject(AccountsPoolService)
    private readonly acctPoolService: AccountsPoolService
  ) {
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
      "authorize",
      "approve",
      "sign",
      "reject",
      "transaction",
      "proposal",
    ];
    // Check if the message contains the keywords
    return keywords.some((keyword) =>
      message.content.text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Execute the transaction authorizer action
   *
   * @param content the content from processMessages
   * @param callback the callback function to pass the result to Eliza runtime
   * @returns the transaction authorization response
   */
  async execute(
    content: TransactionAuthorizerContent | null,
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

    // Get the user id
    const userId = message.userId;
    const isSelf = userId === message.agentId;
    const walletAddress = this.walletSerivce.address;
    const logPrefix = `Account[${walletAddress}/${isSelf ? "root" : userId}]`;

    try {
      // In a real implementation, you would retrieve the proposal from storage
      // based on the proposalId and then process it

      // For now, we'll simulate the authorization process
      if (!content.proposalId || !content.proposalId.startsWith("proposal-")) {
        throw new Error("Invalid proposal ID format");
      }

      if (content.authorize) {
        // Simulate authorizing the transaction
        // In a real implementation, you would:
        // 1. Retrieve the transaction details from storage
        // 2. Sign the transaction with the user's key
        // 3. Return the signed transaction for later execution

        elizaLogger.log(
          `${logPrefix}\n Authorizing transaction proposal: ${content.proposalId}`
        );

        // Simulate a successful authorization
        const authorizationId = `auth-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;

        if (callback) {
          callback({
            text: `I've authorized the transaction proposal ${content.proposalId}. The transaction is now ready to be executed.\n\nAuthorization ID: ${authorizationId}`,
            content: {
              success: true,
              proposalId: content.proposalId,
              authorizationId,
              status: "authorized",
            },
            source: "FlowBlockchain",
          });
        }
      } else {
        // Simulate rejecting the transaction
        elizaLogger.log(
          `${logPrefix}\n Rejecting transaction proposal: ${content.proposalId}`
        );

        if (callback) {
          callback({
            text: `I've rejected the transaction proposal ${content.proposalId}. The transaction will not be executed.`,
            content: {
              success: true,
              proposalId: content.proposalId,
              status: "rejected",
            },
            source: "FlowBlockchain",
          });
        }
      }
    } catch (e) {
      elizaLogger.error("Error authorizing transaction:", e.message);
      callback?.({
        text: `Unable to ${
          content.authorize ? "authorize" : "reject"
        } transaction proposal: ${e.message}`,
        content: {
          error: e.message,
        },
        source: "FlowBlockchain",
      });
    }

    elizaLogger.log(`Finished ${this.name} handler.`);
  }
}

// Register the transaction authorizer action
globalContainer.bind(TransactionAuthorizerAction).toSelf();
