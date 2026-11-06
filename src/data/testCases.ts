/**
 * Test inputs for Live Eval. Each prompt template has one {{placeholder}};
 * the case `input` fills it. Checks are written so they work across all three
 * tiers of a task, even though tiers ask for different output shapes.
 */

export type Check =
  /** 100 if any `accept` label appears (whole word) and no `reject` label does. */
  | { type: 'labels'; accept: string[]; reject?: string[] }
  /** Output must contain a JSON object; score = share of `contains` values found in it. */
  | { type: 'json_contains'; contains: string[] }
  /** Score = share of regexes (case-insensitive) that match the output. */
  | { type: 'regex'; patterns: string[] }
  /** A judge model grades the output 0-100 against the rubric. */
  | { type: 'llm_judge'; rubric: string };

export interface TestCase {
  id: string;
  taskId: string;
  input: string;
  check: Check;
}

const NEG = ['NEGATIVE', 'DISSATISFIED', 'FURIOUS'];
const POS = ['POSITIVE'];

export const TEST_CASES: TestCase[] = [
  // --- Summarization ---
  {
    id: 'sum-1',
    taskId: 'task-sum',
    input:
      'Hi, since your update on Tuesday our dashboard export to CSV times out after 30 seconds for any report over 10k rows. We have a board meeting Friday and need this fixed ASAP. This is the third time this quarter exports have broken.',
    check: {
      type: 'llm_judge',
      rubric: 'Mentions CSV export timing out on large reports after the update, and that the customer is frustrated/urgent.',
    },
  },
  {
    id: 'sum-2',
    taskId: 'task-sum',
    input:
      'Hello team, just wanted to say the new SSO setup went smoothly. One small thing: the Okta logo on the login page is slightly blurry on retina screens. No rush at all.',
    check: { type: 'llm_judge', rubric: 'Identifies the blurry Okta logo on retina screens as a minor issue; sentiment is positive or neutral, not urgent.' },
  },
  {
    id: 'sum-3',
    taskId: 'task-sum',
    input:
      'We were charged twice for the October invoice (INV-2210). I already emailed billing a week ago and got no reply. Please refund the duplicate charge.',
    check: { type: 'llm_judge', rubric: 'States a duplicate charge on invoice INV-2210 and a refund request; notes frustration at no reply.' },
  },
  {
    id: 'sum-4',
    taskId: 'task-sum',
    input:
      'API returns 502 for POST /v2/orders roughly 1 in 20 requests since 14:00 UTC. Steps: send any valid order payload repeatedly. Our checkout is losing sales.',
    check: {
      type: 'llm_judge',
      rubric: 'Captures intermittent 502 errors on POST /v2/orders, business impact on checkout, and (if structured) that reproduction steps were given.',
    },
  },
  {
    id: 'sum-5',
    taskId: 'task-sum',
    input: 'How do I change the timezone shown in my weekly digest emails?',
    check: { type: 'llm_judge', rubric: 'Summarises it as a how-to question about changing the digest email timezone; neutral sentiment, low urgency.' },
  },

  // --- Classification ---
  {
    id: 'cls-1',
    taskId: 'task-cls',
    input: 'Absolutely love the new dark mode, my eyes thank you!',
    check: { type: 'labels', accept: POS, reject: NEG },
  },
  {
    id: 'cls-2',
    taskId: 'task-cls',
    input: 'This is the worst update ever. Nothing loads and support ignores me.',
    check: { type: 'labels', accept: NEG, reject: POS },
  },
  {
    id: 'cls-3',
    taskId: 'task-cls',
    input: 'What time does your support line open on Saturdays?',
    check: { type: 'labels', accept: ['NEUTRAL'], reject: NEG },
  },
  {
    id: 'cls-4',
    taskId: 'task-cls',
    input: 'Oh great, another outage. Exactly what I needed during my demo. Fantastic work.',
    check: { type: 'labels', accept: NEG, reject: POS },
  },
  {
    id: 'cls-5',
    taskId: 'task-cls',
    input: 'I was billed for a plan I cancelled. I want my money back.',
    check: { type: 'labels', accept: [...NEG, 'REFUND_REQUEST'], reject: POS },
  },

  // --- Extraction ---
  {
    id: 'ext-1',
    taskId: 'task-ext',
    input: 'Thanks,\nPriya Raman\nHead of Ops, Lumen Freight\npriya.raman@lumenfreight.com | +1 (415) 555-0142',
    check: { type: 'json_contains', contains: ['Priya Raman', 'priya.raman@lumenfreight.com', 'Lumen Freight', '4155550142'] },
  },
  {
    id: 'ext-2',
    taskId: 'task-ext',
    input: 'Reach me at dk@orbitlabs.io — Daniel Kim, Orbit Labs.',
    check: { type: 'json_contains', contains: ['Daniel Kim', 'dk@orbitlabs.io', 'Orbit Labs'] },
  },
  {
    id: 'ext-3',
    taskId: 'task-ext',
    input: 'Call Sofia (Brightline Health) on 020 7946 0958 ext 12 about the renewal.',
    check: { type: 'json_contains', contains: ['Sofia', 'Brightline Health', '79460958'] },
  },
  {
    id: 'ext-4',
    taskId: 'task-ext',
    input: 'Best, M. Okafor | m.okafor@gmail.com',
    check: { type: 'json_contains', contains: ['Okafor', 'm.okafor@gmail.com'] },
  },
  {
    id: 'ext-5',
    taskId: 'task-ext',
    input: 'Jordan Lee\nSenior Recruiter at Northwind\njordan@northwind.example\n(212) 555-0199',
    check: { type: 'json_contains', contains: ['Jordan Lee', 'jordan@northwind.example', 'Northwind', '2125550199'] },
  },

  // --- Code review ---
  {
    id: 'code-1',
    taskId: 'task-code',
    input:
      '--- a/api/users.ts\n+++ b/api/users.ts\n-export function getUser(id: string): User {\n+export async function getUser(id: string, opts: { includeDeleted: boolean }): Promise<User> {',
    check: { type: 'llm_judge', rubric: 'Flags the breaking change: getUser became async and gained a required opts parameter, so callers must change.' },
  },
  {
    id: 'code-2',
    taskId: 'task-code',
    input:
      '--- a/db/query.py\n+++ b/db/query.py\n-cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))\n+cur.execute(f"SELECT * FROM orders WHERE id = {order_id}")',
    check: { type: 'llm_judge', rubric: 'Identifies the SQL injection risk introduced by switching from a parameterised query to an f-string.' },
  },
  {
    id: 'code-3',
    taskId: 'task-code',
    input: '--- a/README.md\n+++ b/README.md\n-Run `npm start`\n+Run `npm run dev` to start the dev server.',
    check: { type: 'llm_judge', rubric: 'Recognises a docs-only change with no breaking changes or security impact.' },
  },
  {
    id: 'code-4',
    taskId: 'task-code',
    input:
      '--- a/migrations/0042.sql\n+++ b/migrations/0042.sql\n+ALTER TABLE accounts DROP COLUMN legacy_plan;\n+ALTER TABLE accounts ADD COLUMN plan_id UUID NOT NULL;',
    check: { type: 'llm_judge', rubric: 'Flags a breaking schema change: dropped column and a NOT NULL column with no default that will fail on existing rows.' },
  },
  {
    id: 'code-5',
    taskId: 'task-code',
    input:
      '--- a/cache.go\n+++ b/cache.go\n-func (c *Cache) Get(k string) string { c.mu.Lock(); defer c.mu.Unlock(); return c.m[k] }\n+func (c *Cache) Get(k string) string { return c.m[k] }',
    check: { type: 'llm_judge', rubric: 'Identifies the race condition from removing the mutex around map access.' },
  },

  // --- Rewrite ---
  {
    id: 'rew-1',
    taskId: 'task-rew',
    input: 'hey so the launch is gonna slip like 2 weeks prob, design isnt done and QA found stuff. can we push to march 14? lmk',
    check: { type: 'llm_judge', rubric: 'Professional tone; clearly asks to move the launch to March 14; keeps the reasons (design incomplete, QA issues); concise.' },
  },
  {
    id: 'rew-2',
    taskId: 'task-rew',
    input: 'i think maybe we should consider possibly looking at cutting the vendor budget by like 15% if thats ok',
    check: { type: 'llm_judge', rubric: 'Direct, confident recommendation to cut vendor budget by 15%; removes hedging.' },
  },
  {
    id: 'rew-3',
    taskId: 'task-rew',
    input: 'Q3 numbers: revenue $4.2M (+12%), churn 3.1%. Need sign-off from Dana by Friday on the hiring plan. thx',
    check: { type: 'llm_judge', rubric: 'Keeps $4.2M, +12%, 3.1% churn and the Friday deadline for Dana unchanged; asks for sign-off clearly.' },
  },
  {
    id: 'rew-4',
    taskId: 'task-rew',
    input: 'sorry to bother u but the server costs went way up and idk why, can someone look',
    check: { type: 'llm_judge', rubric: 'Professional request to investigate the rise in server costs; no excessive apology.' },
  },
  {
    id: 'rew-5',
    taskId: 'task-rew',
    input: 'FYI the client loved the demo!! they want a proposal by next tues, Sam can you own it',
    check: { type: 'llm_judge', rubric: 'Conveys positive demo result, proposal due next Tuesday, and assigns ownership to Sam.' },
  },

  // --- Routing ---
  {
    id: 'rt-1',
    taskId: 'task-rt',
    input: 'Our API has been returning 500 errors for the last hour, production is down.',
    check: { type: 'labels', accept: ['TIER2_ENG'], reject: ['BILLING', 'SALES', 'TIER1'] },
  },
  {
    id: 'rt-2',
    taskId: 'task-rt',
    input: 'Can I get a copy of last month’s invoice with our VAT number on it?',
    check: { type: 'labels', accept: ['BILLING'], reject: ['TIER2_ENG', 'SALES', 'TIER1'] },
  },
  {
    id: 'rt-3',
    taskId: 'task-rt',
    input: 'We have 400 seats and want to talk about an enterprise contract with SSO.',
    check: { type: 'labels', accept: ['SALES'], reject: ['TIER2_ENG', 'BILLING', 'TIER1'] },
  },
  {
    id: 'rt-4',
    taskId: 'task-rt',
    input: 'I forgot my password and the reset email never arrived.',
    check: { type: 'labels', accept: ['TIER1'], reject: ['BILLING', 'SALES'] },
  },
  {
    id: 'rt-5',
    taskId: 'task-rt',
    input: 'My card was declined when renewing but my bank says everything is fine.',
    check: { type: 'labels', accept: ['BILLING'], reject: ['SALES'] },
  },

  // --- SQL ---
  {
    id: 'sql-1',
    taskId: 'task-sql',
    input: 'Count active users',
    check: { type: 'regex', patterns: ['\\bselect\\b', '\\bcount\\s*\\(', '\\bfrom\\s+"?users\\b', "status\\s*=\\s*'active'"] },
  },
  {
    id: 'sql-2',
    taskId: 'task-sql',
    input: 'Emails of users who signed up in the last 7 days, newest first',
    check: { type: 'regex', patterns: ['\\bselect\\b[\\s\\S]*\\bemail\\b', '\\bcreated_at\\b', "interval\\s*'7 days'|- ?7|7\\s*day", '\\border\\s+by\\b[\\s\\S]*\\bdesc\\b'] },
  },
  {
    id: 'sql-3',
    taskId: 'task-sql',
    input: 'Number of users per status',
    check: { type: 'regex', patterns: ['\\bcount\\s*\\(', '\\bgroup\\s+by\\b[\\s\\S]*\\bstatus\\b'] },
  },
  {
    id: 'sql-4',
    taskId: 'task-sql',
    input: 'The 10 oldest accounts',
    check: { type: 'regex', patterns: ['\\border\\s+by\\b[\\s\\S]*\\bcreated_at\\b', '\\blimit\\s+10\\b'] },
  },
  {
    id: 'sql-5',
    taskId: 'task-sql',
    input: 'Users whose email is from gmail.com',
    check: { type: 'regex', patterns: ['\\bemail\\b', "(i?like|~\\*?)\\s*'%?@?gmail\\.com'?|gmail\\.com"] },
  },

  // --- Address cleaning ---
  {
    id: 'clean-1',
    taskId: 'task-clean',
    input: '123 main street suite 400, san francisco ca 94105',
    check: { type: 'json_contains', contains: ['123 Main St', 'San Francisco', 'CA', '94105'] },
  },
  {
    id: 'clean-2',
    taskId: 'task-clean',
    input: 'po box 88 austin texas 78701-1234',
    check: { type: 'json_contains', contains: ['88', 'Austin', 'TX', '78701'] },
  },
  {
    id: 'clean-3',
    taskId: 'task-clean',
    input: '1600 pennsylvania ave nw washington dc 20500',
    check: { type: 'json_contains', contains: ['1600 Pennsylvania Ave', 'Washington', 'DC', '20500'] },
  },
  {
    id: 'clean-4',
    taskId: 'task-clean',
    input: '77 Mass Ave, Cambridge, Massachusetts, 02139',
    check: { type: 'json_contains', contains: ['77 Massachusetts Ave', 'Cambridge', 'MA', '02139'] },
  },
  {
    id: 'clean-5',
    taskId: 'task-clean',
    input: '500 W 2nd St Apt 3B Austin TX 78701',
    check: { type: 'json_contains', contains: ['500 W 2nd St', 'Austin', 'TX', '78701'] },
  },
];

export function getTestCases(taskId: string): TestCase[] {
  return TEST_CASES.filter((c) => c.taskId === taskId);
}

/** Fill every {{placeholder}} in a template with the case input. */
export function fillTemplate(template: string, input: string): string {
  return template.replace(/\{\{\s*\w+\s*\}\}/g, () => input);
}
