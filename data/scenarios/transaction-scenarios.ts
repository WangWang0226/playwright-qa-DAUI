import type { MintTransactionInput } from '../../pages/MintWorkflowPage';

export type BlockchainNetwork = 'BESU' | 'SEPOLIA' | 'SOLANA';
export type TransactionFlow = 'mint' | 'transfer' | 'burn' | 'mint-transfer' | 'transfer-burn' | 'mint-transfer-burn';

export type TransactionScenario = MintTransactionInput & {
  name: string;
  tcIds: string[];
  flow: TransactionFlow;
  scenarioSet: 'smoke' | 'regression';
  network: BlockchainNetwork;
};

const expectedInitiator = process.env.OPSUI_EXPECTED_INITIATOR || process.env.OPSUI_ADMIN_USERNAME;

const allTransactionScenarios: TransactionScenario[] = [
  {
    name: 'SEPOLIA US customer fiat to US customer ETH_TEST5 vault',
    tcIds: ['TC-UI-OPS-TXN-004', 'TC-UI-OPS-TXN-006'],
    flow: 'mint',
    scenarioSet: 'smoke',
    network: 'SEPOLIA',
    sourceAccount: 'US Customer Fiat Account',
    sourceVault: 'US Customer Vault',
    destinationAccount: 'Sepolia Token (ETH_TEST5)',
    destinationVault: 'US Customer Vault',
    expectedSource: 'US Customer Fiat Account',
    expectedDestination: 'US Customer Vault Wallet',
    expectedHistorySource: 'fa-us-customer',
    expectedHistoryDestination: '5-wallet-USDC',
    expectedInitiator,
    amount: '5',
    memo: 'playwright mint'
  },
  {
    name: 'SEPOLIA US customer ETH_TEST5 vault to DDA customer ETH_TEST5 vault',
    tcIds: ['TC-UI-OPS-LIFE-001'],
    flow: 'transfer',
    scenarioSet: 'smoke',
    network: 'SEPOLIA',
    sourceAccount: 'Sepolia Token (ETH_TEST5)',
    sourceVault: 'US Customer Vault',
    destinationAccount: 'Sepolia Token (ETH_TEST5)',
    destinationVault: 'DDA Customer Vault 6',
    expectedSource: 'US Customer Vault Wallet',
    expectedDestination: 'DDA Customer Vault 6 Wallet',
    expectedHistorySource: '5-wallet-USDC',
    expectedHistoryDestination: '6-wallet-USDC',
    expectedInitiator,
    amount: '5',
    memo: 'playwright transfer'
  },
  {
    name: 'SEPOLIA DDA customer ETH_TEST5 vault to DDA customer fiat',
    tcIds: ['TC-UI-OPS-LIFE-003'],
    flow: 'burn',
    scenarioSet: 'smoke',
    network: 'SEPOLIA',
    sourceAccount: 'Sepolia Token (ETH_TEST5)',
    sourceVault: 'DDA Customer Vault 6',
    destinationAccount: 'DDA Customer Fiat Account',
    destinationVault: 'DDA Customer Vault 6',
    expectedSource: 'DDA Customer Vault 6 Wallet',
    expectedDestination: 'DDA Customer Fiat Account',
    expectedHistorySource: '6-wallet-USDC',
    expectedHistoryDestination: 'fa-ca-customer-dda',
    expectedInitiator,
    amount: '5',
    memo: 'playwright burn'
  },
  {
    name: 'SEPOLIA US customer fiat to DDA customer fiat',
    tcIds: ['TC-UI-OPS-LIFE-MTB-001'],
    flow: 'mint-transfer-burn',
    scenarioSet: 'smoke',
    network: 'SEPOLIA',
    sourceAccount: 'US Customer Fiat Account',
    sourceVault: 'US Customer Vault',
    destinationAccount: 'DDA Customer Fiat Account',
    destinationVault: 'DDA Customer Vault 6',
    expectedSource: 'US Customer Fiat Account',
    expectedDestination: 'DDA Customer Fiat Account',
    expectedHistorySource: 'fa-us-customer',
    expectedHistoryDestination: 'fa-ca-customer-dda',
    expectedInitiator,
    amount: '1',
    memo: 'playwright mint-transfer-burn'
  }
];

export const mintScenarios = scenariosForFlow('mint');
export const transferScenarios = scenariosForFlow('transfer');
export const burnScenarios = scenariosForFlow('burn');
export const mintTransferBurnScenarios = scenariosForFlow('mint-transfer-burn');

export function scenariosForFlow(flow: TransactionFlow, network?: BlockchainNetwork) {
  return allTransactionScenarios.filter(
    scenario => scenario.flow === flow && (!network || scenario.network === network)
  );
}

export function scenarioMemo(scenario: TransactionScenario) {
  return `${scenario.memo} ${Date.now()}`;
}
