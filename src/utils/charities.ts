import { CharityAggregator } from '../types';

export const CHARITY_AGGREGATORS: CharityAggregator[] = [
  {
    id: 'globalgiving',
    name: 'GlobalGiving',
    region: 'global',
    url: 'https://www.globalgiving.org',
    description: 'World’s largest crowdfunding community connecting donors with vetted grassroots non-profits in 175+ countries.',
    feeInfo: 'Vetted non-profit partners · Tax-deductible worldwide',
    highlight: true,
  },
  {
    id: 'everyorg',
    name: 'Every.org',
    region: 'global',
    url: 'https://www.every.org',
    description: 'Modern, tech-forward giving platform supporting 1M+ charities with single-cart giving and 0% platform fees.',
    feeInfo: 'Zero platform fees · Supports 1,000,000+ charities',
    highlight: true,
  },
  {
    id: 'paypalgivingfund',
    name: 'PayPal Giving Fund',
    region: 'global',
    url: 'https://www.paypal.com/givingfund',
    description: 'Trusted global donation aggregator passing 100% of donations to enrolled charities without deduction.',
    feeInfo: '0% platform fee · 100% donation pass-through',
    highlight: true,
  },
  {
    id: 'justgiving',
    name: 'JustGiving',
    region: 'uk',
    url: 'https://www.justgiving.com',
    description: 'Leading international fundraising platform with automatic UK Gift Aid reclamation (+25% boost).',
    feeInfo: 'UK & International · Automated Gift Aid recovery',
  },
  {
    id: 'givenow',
    name: 'GiveNow',
    region: 'au',
    url: 'https://www.givenow.com.au',
    description: 'Australia’s first and most established community giving platform for Deductible Gift Recipient (DGR) organizations.',
    feeInfo: 'Australia focused · Direct DGR compliance',
  },
  {
    id: 'canadahelps',
    name: 'CanadaHelps',
    region: 'ca',
    url: 'https://www.canadahelps.org',
    description: 'Canada’s premier non-profit platform for donating to over 86,000 registered Canadian charities.',
    feeInfo: 'Instant Canadian official tax receipts',
  },
  {
    id: 'benevity',
    name: 'Benevity',
    region: 'global',
    url: 'https://www.benevity.com',
    description: 'Global corporate giving and matching platform used by top companies for employer matched giving.',
    feeInfo: 'Corporate matching · Workplace giving integration',
  },
];

export function getCharityById(id?: string): CharityAggregator | undefined {
  if (!id) return undefined;
  return CHARITY_AGGREGATORS.find((c) => c.id === id);
}
