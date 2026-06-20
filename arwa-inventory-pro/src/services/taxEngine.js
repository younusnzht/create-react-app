// taxEngine.js — Canadian GST/HST/PST/QST calculation engine

export const PROVINCES = {
  AB: { name: 'Alberta',                    code: 'AB', GST: 5,    PST: 0,   HST: 0,  QST: 0,      type: 'GST'      },
  BC: { name: 'British Columbia',           code: 'BC', GST: 5,    PST: 7,   HST: 0,  QST: 0,      type: 'GST+PST'  },
  MB: { name: 'Manitoba',                   code: 'MB', GST: 5,    PST: 7,   HST: 0,  QST: 0,      type: 'GST+RST'  },
  NB: { name: 'New Brunswick',              code: 'NB', GST: 0,    PST: 0,   HST: 15, QST: 0,      type: 'HST'      },
  NL: { name: 'Newfoundland & Labrador',    code: 'NL', GST: 0,    PST: 0,   HST: 15, QST: 0,      type: 'HST'      },
  NS: { name: 'Nova Scotia',                code: 'NS', GST: 0,    PST: 0,   HST: 15, QST: 0,      type: 'HST'      },
  NT: { name: 'Northwest Territories',      code: 'NT', GST: 5,    PST: 0,   HST: 0,  QST: 0,      type: 'GST'      },
  NU: { name: 'Nunavut',                    code: 'NU', GST: 5,    PST: 0,   HST: 0,  QST: 0,      type: 'GST'      },
  ON: { name: 'Ontario',                    code: 'ON', GST: 0,    PST: 0,   HST: 13, QST: 0,      type: 'HST'      },
  PE: { name: 'Prince Edward Island',       code: 'PE', GST: 0,    PST: 0,   HST: 15, QST: 0,      type: 'HST'      },
  QC: { name: 'Quebec',                     code: 'QC', GST: 5,    PST: 0,   HST: 0,  QST: 9.975,  type: 'GST+QST'  },
  SK: { name: 'Saskatchewan',               code: 'SK', GST: 5,    PST: 6,   HST: 0,  QST: 0,      type: 'GST+PST'  },
  YT: { name: 'Yukon',                      code: 'YT', GST: 5,    PST: 0,   HST: 0,  QST: 0,      type: 'GST'      },
};

// Zero-rated for GST/HST (federal exemption)
export const ZERO_RATED = [
  'Basic Groceries', 'Prescription Drugs', 'Medical Devices',
  'Agricultural Products', 'Exports', 'Fishing Supplies',
];

// PST-exempt categories by province
const PST_EXEMPT = {
  BC: ['Basic Groceries', 'Prescription Drugs', 'Medical Devices', 'Children Clothing'],
  MB: ['Basic Groceries', 'Prescription Drugs', 'Medical Devices'],
  SK: ['Prescription Drugs', 'Medical Devices', 'Basic Groceries'],
};

/**
 * Calculate Canadian taxes for a given amount.
 * @param {number} subtotal - Pre-tax amount
 * @param {string} province - Province code (e.g. 'ON', 'BC')
 * @param {string} category - Product category (for exemption checks)
 * @param {boolean} gstExempt - Customer holds a GST exemption (e.g. reseller, non-profit)
 * @returns {{ GST, HST, PST, QST, total, rate, breakdown }}
 */
export function calcTax(subtotal, province = 'ON', category = '', gstExempt = false) {
  const p = PROVINCES[province] || PROVINCES.ON;
  const zeroRated = ZERO_RATED.includes(category);
  const pstExempt = (PST_EXEMPT[province] || []).includes(category);

  const GST = (!zeroRated && !gstExempt) ? round(subtotal * p.GST / 100) : 0;
  const HST = (!zeroRated && !gstExempt) ? round(subtotal * p.HST / 100) : 0;
  const PST = (!zeroRated && !pstExempt) ? round(subtotal * p.PST / 100) : 0;
  const QST = (!zeroRated && !gstExempt) ? round(subtotal * p.QST / 100) : 0;
  const total = round(GST + HST + PST + QST);
  const rate  = round(p.GST + p.PST + p.HST + p.QST);

  return { GST, HST, PST, QST, total, rate, province: p, zeroRated, gstExempt };
}

/** Get total effective tax rate for a province */
export function getProvinceRate(province = 'ON') {
  const p = PROVINCES[province] || PROVINCES.ON;
  return round(p.GST + p.PST + p.HST + p.QST);
}

/** Format a tax breakdown as a human-readable string */
export function formatTaxLabel(province = 'ON') {
  const p = PROVINCES[province] || PROVINCES.ON;
  const parts = [];
  if (p.HST) parts.push(`HST ${p.HST}%`);
  if (p.GST) parts.push(`GST ${p.GST}%`);
  if (p.PST) parts.push(`${province === 'MB' ? 'RST' : 'PST'} ${p.PST}%`);
  if (p.QST) parts.push(`QST ${p.QST}%`);
  return parts.join(' + ') || 'No Tax';
}

function round(n) { return Math.round(n * 100) / 100; }
