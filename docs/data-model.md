# Litchi data model

A Supabase (Postgres) schema for the system the prototype currently fakes.

**Status: designed and tested, not deployed.** Nothing in the app reads from
this. The app is still a front end over `src/lib/data.ts`, which is the right
shape for a demo — it holds no personal information, needs no login, and
cannot leak what it does not store. This exists so that the day a finance
partner or an agency says yes, the answer to "what would you actually build"
is a migration rather than a conversation.

```
supabase/
  migrations/
    0001_schema.sql       tables, types, statutory constraints
    0002_rls.sql          grants and row level security
    0003_invariants.sql   triggers for rules that must hold for every client
    0004_storage.sql      the private document bucket
  tests/
    rls.test.sql          15 attacks that must fail
```

All four migrations and the full test suite were run against PostgreSQL 16
before this was written. The tests pass.

---

## The one thing to understand first

**Postgres row level security is row-level, not column-level.** You cannot
hand a role a row of `tenancies` and withhold a column of it.

That single fact decides the shape of the whole schema, because the product's
central promise is a column-level one: an agency confirms the rent, the bond
and the start date, and is told *nothing* about the tenant's finances. Express
that as "agents get a policy on `tenancies` scoped to their agency" and you
have handed them the entire row — and every column anybody adds to that table
later.

So agents have **no policy on `tenancies` at all**. Instead
`verification_requests` carries its own copy of the five facts:

```sql
snapshot_tenant_name, snapshot_address, snapshot_weekly_rent,
snapshot_bond_amount, snapshot_start_date
```

Agents are granted that table, scoped to their own agency, and nothing else.
The boundary becomes structural rather than a promise about which columns the
API happens to select.

This is not denormalisation for speed. It is also the correct domain model: a
verification attests to the values **as they stood when it was answered**. If
the rent changes in March, the February verification should still say what was
confirmed in February. The copy is the record.

## The agent answering a link is not logged in

The verification screen has no account behind it — that is the entire reason
agencies will use it. So there is no `auth.uid()`, and **no RLS policy can
express "the holder of this token"**.

That path therefore cannot be protected by RLS at all. It goes through an Edge
Function holding `service_role` which:

1. hashes the token from the URL and looks up the request,
2. checks it is `awaiting` and unexpired,
3. returns **only the five snapshot fields**, never the row,
4. writes the answer and lets a trigger close the request.

Tokens are stored as `bytea` hashes. The plaintext exists only in the emailed
link. RLS protects the portal; token possession protects the link; and the two
must not be confused.

## Who can see what

| | tenant | agent | admin |
|---|---|---|---|
| `tenancies` | own | **none** | all |
| `tenancy_documents` | own | **none** | **none** |
| `verification_requests` | own tenancy | own agency | all |
| `move_plans`, `move_cost_lines` | own | **none** | read |
| `applications`, `facilities`, `repayments` | own | **none** | all |
| `revenue_events` | own facility | **none** | all |
| `partner_commercials` | none | none | all |
| `audit_log` | insert only | insert only | read only |

Three entries there are deliberate and worth defending:

**Admins cannot read tenancy documents.** The agreement is collected to read
five fields off it and is useful for nothing afterwards. Staff access is a
reviewed `service_role` action that writes to `audit_log`, not a row in
somebody's dashboard. If that turns out to be too strict in support, the fix is
a break-glass function that logs, not a policy.

**Tenants cannot read `partner_commercials`.** The app *does* disclose what
Litchi earns — but it reads `revenue_events` for that tenant's own facility,
which is what was actually earned on their deal, rather than the rate card for
everybody's.

**Nobody can update or delete `audit_log`.** There is no policy and no grant
for either, including for admins. An audit log an operator can edit is
decoration rather than evidence.

## Roles are not a column

`user_roles` is a separate table with **no insert, update or delete policy for
any application role**. Role changes are a `service_role` operation.

A `profiles.role` column that its own subject can update is a one-line
privilege escalation, and it is the single most common way a Supabase app gets
owned. Test 3 in the suite is exactly that attack.

Policies read the role through `public.has_role()`, a `SECURITY DEFINER`
function with `set search_path = ''`. The empty search path matters: a definer
function without it can be pointed at an attacker's `user_roles` by a crafted
search path.

## Rules the database enforces, not just the UI

A rule that lives only in a React component survives exactly as long as nobody
calls the API directly. These are triggers:

- **You cannot borrow more than the move costs.** `amount_requested` is checked
  against the sum of that plan's cost lines. This is the difference between
  rental-specific finance and a personal loan in a moving-themed skin, so it is
  not left to a component that has no field to type a bigger number into.
- **A verification can only be sent to a domain the agency has registered.**
  This closes the hole in the flow: the agent's address arrives on a document
  the *tenant* uploaded, so without `agency_domains` a tenant and an accomplice
  can verify their own tenancy and hand the lender a source-verified fiction.
- **An expired request cannot be answered**, and an answer closes its request.
- **Disbursements cannot exceed the amount advanced.**

And as plain constraints: the RTA bond cap (four weeks' rent) and pet bond cap
(two weeks, in force since 1 December 2025) are `CHECK`s on `tenancies`.

## Money

`numeric(12,2)` everywhere. Never `real` or `double precision` — Postgres
`numeric` is exact decimal and this is a credit ledger. Integer cents would
also be exact; `numeric` was chosen because it reads correctly in ad-hoc SQL,
which is where most of these numbers will be looked at.

## What is deliberately not here

- **A partner routing engine.** `finance_partners` is a table and
  `applications.partner_id` is a column, so nothing assumes there is only ever
  one lender. Building a router with zero partners signed is a guess about a
  problem nobody has.
- **A rewards or score schema.** Both are in the prototype and both are
  candidates for removal; committing them to tables would be the wrong order.
- **Retention automation.** `tenancy_documents.delete_after` is a column, and
  a scheduled job has to act on it. Storage expires nothing on its own, so
  without that job the column is a good intention.
- **PII minimisation beyond the obvious.** Income, employment and bank data
  are not modelled at all: the partner assesses affordability and holds that
  data. Litchi should store what it needs to run a platform and no more.

## Open questions

Things I could not settle without a decision from you or a partner:

1. **Where does the affordability assessment live?** Right now nothing in this
   schema holds income. That is the correct default — the lender is the
   creditor and the CCCFA obligations are theirs — but if Litchi ever
   pre-qualifies applicants, it acquires that data and everything that comes
   with it.
2. **Does an agency ever get a login at all?** Everything works through
   tokenised links today. `agency_members` exists for a portal, but the portal
   may not be worth building.
3. **How is an agency's domain first verified?** `agency_domains.verified_at`
   assumes a process — an emailed challenge, or a manual check against the
   REAA register. That process is the real anti-fraud control; the column just
   records its outcome.

## Running it

```bash
supabase start
supabase db reset          # applies migrations/ in order
supabase test db           # runs tests/rls.test.sql
```

The tests use Supabase's impersonation pattern: become `authenticated` and set
`request.jwt.claims`, which is what `auth.uid()` reads. Each test runs inside a
transaction that rolls back.

**Add a test for every policy you add.** The attacks in that file are not
hypothetical — they are the sentences this product says out loud, written as
things that must fail. A policy file that has only been read is a policy file
that has not been tested.
