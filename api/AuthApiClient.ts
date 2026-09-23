import { APIRequestContext, expect } from '@playwright/test';

export type LoginResponse = {
  token?: string;
  accessToken?: string;
  jwt?: string;
  [key: string]: unknown;
};

export class AuthApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async register(input: { username: string; email: string; password: string }) {
    const response = await this.request.post('/api/v1/auth/register', {
      data: {
        username: input.username,
        email: input.email,
        password: input.password
      }
    });

    expect(
      [200, 201, 400, 409],
      `Register should create the user or report that it already exists. Received ${response.status()}`
    ).toContain(response.status());

    return { response, body: await safeJson(response) };
  }

  async login(input: { username: string; password: string }) {
    const response = await this.request.post('/api/v1/auth/login', {
      data: {
        username: input.username,
        password: input.password
      }
    });

    await expect(response, 'API login should return HTTP 200').toBeOK();
    const body = (await response.json()) as LoginResponse;
    const token = body.token || body.accessToken || body.jwt;

    return { response, body, token };
  }
}

async function safeJson(response: { json: () => Promise<unknown> }) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
