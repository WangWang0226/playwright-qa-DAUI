import { APIRequestContext, expect } from '@playwright/test';

export type TransactionRequest = {
  origin: string;
  originJurisdiction: string;
  originType: 'FIAT' | 'DIGITAL';
  destination: string;
  destinationJurisdiction: string;
  destinationType: 'FIAT' | 'DIGITAL';
  assetId: string;
  amount: number;
};

export type TransactionResponse = {
  transactionId?: string;
  id?: string;
  flowType?: string;
  status?: string;
  error?: string | null;
  initiatedByUserId?: string;
  epicsDebitRef?: string | null;
  epicsCreditRef?: string | null;
  createdAt?: string;
  updatedAt?: string;
  assetId?: string;
  amount?: number;
  txOperations?: Array<{
    fireblocksTxId?: string;
    fireblocksStatus?: string;
    fireblocksSubStatus?: string;
    fireblocksTxHash?: string;
    submittedAt?: string;
    updatedAt?: string;
    error?: string | null;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export class TransactionApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async submitTransaction(input: {
    userId: string;
    token?: string;
    transaction: TransactionRequest;
  }) {
    const response = await this.request.post('/v1/transaction', {
      headers: authHeaders(input.userId, input.token),
      data: input.transaction
    });

    await expect(response, 'Submit transaction should return HTTP 2xx').toBeOK();
    const body = (await response.json()) as TransactionResponse;
    const transactionId = body.transactionId || body.id;
    expect(transactionId, 'Submit transaction response should include transactionId or id').toBeTruthy();

    return { response, body, transactionId: transactionId as string };
  }

  async getTransactionStatus(input: { transactionId: string; userId?: string; token?: string }) {
    const response = await this.request.get(`/v1/transaction/${input.transactionId}`, {
      headers: authHeaders(input.userId, input.token)
    });

    await expect(response, 'Get transaction status should return HTTP 2xx').toBeOK();
    const body = (await response.json()) as TransactionResponse;

    return { response, body };
  }

  async waitForTransactionStatus(input: {
    transactionId: string;
    expectedStatus: string;
    userId?: string;
    token?: string;
    timeoutMs?: number;
    intervalMs?: number;
  }) {
    const timeoutMs = input.timeoutMs ?? Number(process.env.OPSUI_API_TRANSACTION_TIMEOUT_MS || 180000);
    const intervalMs = input.intervalMs ?? Number(process.env.OPSUI_API_TRANSACTION_POLL_INTERVAL_MS || 5000);
    const deadline = Date.now() + timeoutMs;
    let lastBody: TransactionResponse | undefined;

    while (Date.now() < deadline) {
      const result = await this.getTransactionStatus(input);
      lastBody = result.body;

      if (lastBody.status === input.expectedStatus) {
        return result;
      }

      if (isTerminalFailureStatus(lastBody.status)) {
        throw new Error(`Transaction ${input.transactionId} reached failure status ${lastBody.status}:\n${JSON.stringify(lastBody, null, 2)}`);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(
      `Timed out after ${timeoutMs}ms waiting for transaction ${input.transactionId} to reach ${input.expectedStatus}. Last response:\n${JSON.stringify(
        lastBody,
        null,
        2
      )}`
    );
  }
}

function authHeaders(userId?: string, token?: string) {
  const headers: Record<string, string> = {};

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function isTerminalFailureStatus(status: string | undefined) {
  return !!status && /FAILED|REJECTED|CANCELLED|CANCELED|ERROR/i.test(status);
}

export function responseContainsValue(value: unknown, expected: string | number): boolean {
  if (value === expected) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => responseContainsValue(entry, expected));
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some((entry) => responseContainsValue(entry, expected));
  }

  return false;
}
