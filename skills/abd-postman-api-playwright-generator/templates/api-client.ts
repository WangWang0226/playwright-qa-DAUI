import { APIRequestContext, expect } from '@playwright/test';

export class ExampleApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async getHealth() {
    const response = await this.request.get('/health');
    await expect(response).toBeOK();
    return response.json();
  }
}
