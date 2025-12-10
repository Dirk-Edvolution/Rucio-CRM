
import { Deal, OdooLink } from '../types';

interface OdooCompany {
  id: string;
  name: string;
  region: string;
  currency: string;
}

const ODOO_COMPANIES: Record<string, OdooCompany> = {
  'US': { id: 'US-01', name: 'Odoo Inc (North America)', region: 'US', currency: 'USD' },
  'UK': { id: 'UK-02', name: 'Odoo Ltd (UK & Ireland)', region: 'UK', currency: 'GBP' },
  'EU': { id: 'EU-03', name: 'Odoo Europe (Mainland)', region: 'EU', currency: 'EUR' },
  'APAC': { id: 'AP-04', name: 'Odoo Asia Pacific', region: 'APAC', currency: 'USD' },
  'LATAM_CL': { id: 'CL-05', name: 'Odoo Chile SpA', region: 'Chile', currency: 'CLP' },
  'LATAM_MX': { id: 'MX-06', name: 'Odoo Mexico SA', region: 'Mexico', currency: 'MXN' }
};

export const getOdooCompanyForDeal = (country: string): OdooCompany => {
  const c = country.toLowerCase();
  
  // Specific Latin American mapping logic (Mock)
  if (c.includes('chile')) return ODOO_COMPANIES['LATAM_CL'];
  if (c.includes('mexico')) return ODOO_COMPANIES['LATAM_MX'];

  if (c === 'united states' || c === 'usa' || c === 'us') return ODOO_COMPANIES['US'];
  if (c === 'united kingdom' || c === 'uk' || c === 'ireland') return ODOO_COMPANIES['UK'];
  if (['germany', 'france', 'spain', 'italy', 'netherlands'].includes(c)) return ODOO_COMPANIES['EU'];
  
  return ODOO_COMPANIES['APAC']; // Default fallback
};

export const createSalesOrder = async (deal: Deal, companyId: string, currency: string, localValue: number): Promise<OdooLink> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
        salesOrderId: `SO-${Math.floor(10000 + Math.random() * 90000)}`,
        companyId: companyId,
        companyName: Object.values(ODOO_COMPANIES).find(c => c.id === companyId)?.name || 'Odoo Global',
        currency: currency,
        totalLocalCurrency: localValue,
        status: 'DRAFT',
        url: 'https://odoo.com/web#cids=1&menu_id=1&action=123&model=sale.order&view_type=form'
    };
};
