// Claude AI Service — Arwa 1.0
// Haiku for scans (cost-efficient) · Sonnet for self-healing (quality)
// Prompt caching enabled on both to cut input token costs by up to 90%

const SCAN_MODEL   = 'claude-haiku-4-5-20251001';
const HEAL_MODEL   = 'claude-sonnet-4-6';

// Pricing per million tokens (USD)
export const PRICING = {
  [SCAN_MODEL]:  { input: 0.80, output: 4.00,  cacheWrite: 1.00, cacheRead: 0.08 },
  [HEAL_MODEL]:  { input: 3.00, output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
};

export const PLAN_DAILY_LIMITS = {
  basic:        10,
  intermediate: 100,
  super:        600,   // capped at 600/day per cost recommendation
};
export const OVERAGE_COST_PER_SCAN = 0.005; // $0.005 per scan beyond plan limit (Enterprise only)

// Budget thresholds (30 % buffer built-in)
export const MONTHLY_BUDGETS = {
  basic:        2,
  intermediate: 15,
  super:        80,
  selfHealing:  25,
};

const SCAN_SYSTEM_PROMPT = `You are Arwa AI Guardian, an intelligent inventory management system monitor for Arwa Enterprises.

Your role:
- Analyse CPU, RAM, disk, database and API performance metrics
- Identify inventory issues (low stock, expiring products, anomalies)
- Detect security concerns and operational risks
- Produce a concise health assessment with actionable issues

Respond ONLY with valid JSON — no markdown, no prose outside the JSON:
{
  "healthScore": <0-100>,
  "performanceScore": <0-100>,
  "securityScore": <0-100>,
  "stabilityScore": <0-100>,
  "summary": "<1-2 sentence plain-English status>",
  "issues": [
    {
      "type": "performance|security|memory|inventory|dependency|crash",
      "severity": "critical|warning|info",
      "title": "<short title>",
      "description": "<specific description with values>",
      "module": "<affected module>",
      "autoFixable": true|false,
      "recommendation": "<specific action>"
    }
  ],
  "recommendations": ["<top 3 immediate actions>"]
}`;

const HEAL_SYSTEM_PROMPT = `You are Arwa AI Self-Healing Engine, an autonomous repair system for Arwa 1.0.

You analyse issues and generate safe, specific remediation plans.

Respond ONLY with valid JSON:
{
  "canAutoFix": true|false,
  "confidence": <0-100>,
  "repairSteps": [
    {
      "step": <number>,
      "action": "<description>",
      "type": "database|memory|security|inventory|config",
      "risk": "low|medium|high",
      "reversible": true|false
    }
  ],
  "estimatedImpact": "<expected improvement>",
  "requiresApproval": true|false,
  "approvalReason": "<reason if approval needed>",
  "rollbackPlan": "<how to undo>"
}`;

export function calcCost(model, inputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0) {
  const p = PRICING[model] || PRICING[SCAN_MODEL];
  const regularInput = Math.max(0, inputTokens - cacheReadTokens - cacheWriteTokens);
  return (
    (regularInput         / 1_000_000) * p.input      +
    (outputTokens         / 1_000_000) * p.output     +
    (cacheWriteTokens     / 1_000_000) * p.cacheWrite +
    (cacheReadTokens      / 1_000_000) * p.cacheRead
  );
}

async function callAnthropic(apiKey, model, systemPrompt, userContent, maxTokens = 1500) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta':  'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!resp.ok) {
    let msg = `API error ${resp.status}`;
    try { const e = await resp.json(); msg = e?.error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text || '';
  const usage = data.usage || {};

  // Extract JSON (Claude sometimes wraps in markdown fences)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned non-JSON response');

  const result = JSON.parse(match[0]);
  const cost = calcCost(
    model,
    usage.input_tokens || 0,
    usage.output_tokens || 0,
    usage.cache_read_input_tokens || 0,
    usage.cache_creation_input_tokens || 0,
  );

  return { result, cost, usage };
}

export async function runAIScan({ apiKey, metrics, products, issues }) {
  const productSummary = {
    total:        products.length,
    lowStock:     products.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
    outOfStock:   products.filter(p => p.stock === 0).length,
    expiringSoon: products.filter(p => p.status === 'expiring_soon').length,
    totalValue:   products.reduce((s, p) => s + p.stock * p.purchasePrice, 0).toFixed(2),
  };

  const userContent =
    `System metrics:\n${JSON.stringify(metrics, null, 2)}\n\n` +
    `Inventory summary:\n${JSON.stringify(productSummary, null, 2)}\n\n` +
    `Pending issues: ${issues.filter(i => i.status === 'pending').length}\n` +
    `Timestamp: ${new Date().toISOString()}`;

  return callAnthropic(apiKey, SCAN_MODEL, SCAN_SYSTEM_PROMPT, userContent, 1500);
}

export async function runSelfHeal({ apiKey, issue, systemContext }) {
  const userContent =
    `Issue to resolve:\n${JSON.stringify(issue, null, 2)}\n\n` +
    `System context:\n${JSON.stringify(systemContext, null, 2)}`;

  return callAnthropic(apiKey, HEAL_MODEL, HEAL_SYSTEM_PROMPT, userContent, 2048);
}
