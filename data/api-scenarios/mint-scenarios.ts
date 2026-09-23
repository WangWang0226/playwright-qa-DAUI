import { TransactionRequest } from '../../api/TransactionApiClient';

export const mintApiScenario: TransactionRequest = {
  origin: 'fa-us-customer',
  originJurisdiction: 'US',
  originType: 'FIAT',
  destination: '5',
  destinationJurisdiction: 'US',
  destinationType: 'DIGITAL',
  assetId: 'ETH_TEST5',
  amount: 1
};
