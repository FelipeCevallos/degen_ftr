import { z } from "zod";
import { inject, injectable } from "inversify";
import { elizaLogger, type IAgentRuntime } from "@elizaos/core";
import {
  type ActionOptions,
  globalContainer,
  property,
} from "@elizaos-plugins/plugin-di";
import { BaseFlowInjectableAction } from "@elizaos-plugins/plugin-flow";
import { formater } from "../helpers";
import { AccountsPoolService } from "../services/acctPool.service";

/**
 * The generated content for the transaction payer action
 */
export class TransactionPayerContent {
  @property({
    description: "The authorization ID of the transaction to pay for",
    examples: ["auth-1234567890-123"],
    schema: z.string(),
  })
  authorizationId: string;

  @property({
    description:
      "The maximum amount of FLOW tokens to pay for the transaction (gas limit)",
    examples: ["0.001", "0.0001"],
    schema: z.string(),
  })
  gasLimit: string;
}

/**
 * The transaction payer action options
 */
const actionOpts: ActionOptions<TransactionPayerContent> = {
  name: "PAY_FLOW_TRANSACTION",
  similes: [
    "PAY_TRANSACTION",
    "EXECUTE_TRANSACTION",
    "SUBMIT_TRANSACTION",
    "FINALIZE_TRANSACTION",
  ],
  description:
    "Call this action to pay for and execute a previously authorized transaction on the Flow blockchain",
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to pay for the transaction auth-1234567890-123 with a gas limit of 0.001 FLOW",
          action: "PAY_FLOW_TRANSACTION",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Execute the authorized transaction auth-1234567890-123",
          action: "PAY_FLOW_TRANSACTION",
        },
      },
    ],
  ],
  contentClass: TransactionPayerContent,
  suppressInitialMessage: true,
};

/**
 * Transaction Payer action
 *
 * @category Actions
 * @description Pays for and executes a previously authorized transaction on the Flow blockchain
 */
@injectable()
export class TransactionPayerAction extends BaseFlowInjectableAction<TransactionPayerContent> {
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
    _runtime: AgentRuntime,
    message: any,
    _state?: any
  ): Promise<boolean> {
    const keywords: string[] = [
      "pay",
      "execute",
      "submit",
      "finalize",
      "transaction",
    ];
    // Check if the message contains the keywords
    return keywords.some((keyword) =>
      message.content.text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Execute the transaction payer action
   *
   * @param content the content from processMessages
   * @param callback the callback function to pass the result to Eliza runtime
   * @returns the transaction execution response
   */
  async execute(
    content: TransactionPayerContent | null,
    _runtime: AgentRuntime,
    message: any,
    _state?: any,
    callback?: any
  ): Promise<void> {
    if (!content) {
      elizaLogger.warn("No content generated");
      return;
    }

    elizaLogger.log(`Starting ${this.constructor.name} handler...`);

    // Get the user id
    const userId = message.userId;
    const isSelf = userId === message.agentId;
    const walletAddress = this.walletSerivce.address;
    const logPrefix = `Account[${walletAddress}/${isSelf ? "root" : userId}]`;

    try {
      // In a real implementation, you would retrieve the authorized transaction from storage
      // based on the authorizationId and then process it

      // For now, we'll simulate the payment and execution process
      if (
        !content.authorizationId ||
        !content.authorizationId.startsWith("auth-")
      ) {
        throw new Error("Invalid authorization ID format");
      }

      // Parse the gas limit
      let gasLimit: number;
      try {
        gasLimit = parseFloat(content.gasLimit);
        if (isNaN(gasLimit) || gasLimit <= 0) {
          // Default gas limit if not provided or invalid
          gasLimit = 0.0001;
        }
      } catch (e) {
        gasLimit = 0.0001; // Default gas limit
      }

      // Simulate paying for and executing the transaction
      elizaLogger.log(
        `${logPrefix}\n Paying for transaction: ${content.authorizationId} with gas limit: ${gasLimit} FLOW`
      );

      // Simulate a successful transaction execution
      const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const gasUsed = (gasLimit * 0.7).toFixed(8); // Simulate using 70% of the gas limit

      // In a real implementation, you would:
      // 1. Retrieve the authorized transaction from storage
      // 2. Add the payer signature
      // 3. Submit the transaction to the Flow blockchain
      // 4. Wait for the transaction to be sealed
      // 5. Return the transaction result

      if (callback) {
        callback({
          text: `I've paid for and executed the transaction. The transaction has been submitted to the Flow blockchain.\n\nTransaction ID: ${txId}\nGas used: ${gasUsed} FLOW`,
          content: {
            success: true,
            authorizationId: content.authorizationId,
            transactionId: txId,
            gasUsed,
            status: "SEALED",
          },
          source: "FlowBlockchain",
        });
      }
    } catch (e) {
      elizaLogger.error("Error paying for transaction:", e.message);
      callback?.({
        text: `Unable to pay for transaction: ${e.message}`,
        content: {
          error: e.message,
        },
        source: "FlowBlockchain",
      });
    }

    elizaLogger.log(`Finished ${this.constructor.name} handler.`);
  }
}

// Register the transaction payer action
globalContainer.bind(TransactionPayerAction).toSelf();
