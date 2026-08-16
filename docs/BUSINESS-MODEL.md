# Business model

## Position

Nisos is not another banking app. Banking apps compete on features inside one bank; government
portals compete with nobody and are used a few times a year. Nisos sits across both: **your money,
your identity and your government services in one place**, so a citizen stops keeping three banking
apps, five government logins and a folder of PDFs.

The wedge is identity plus the government directory — the things nobody else bundles — and money is
what makes it a daily app rather than an annual one.

## Founding constraint

**Nisos never charges for access to a legally free government service.** Statutory fees belong to
the department. Charging citizens for public services would poison the institutional relationships
the product depends on, and it is the wrong thing to do. Every plan in the app keeps the full
government directory free.

## Revenue

| Line | Who pays | What they get | Notes |
| --- | --- | --- | --- |
| **Free personal** | — | Digital ID, full government directory, document vault, bills and reminders, one connected account | The base everyone gets |
| **Premium personal** (~€4.99/mo) | Citizen | Unlimited connected accounts, advanced analytics and budgets, priority support, faster document verification, family sharing | Convenience, never access to public services |
| **Business** (~€14.99/mo) | SME | Company profile, employer services, merchant QR payments with settlement reporting, multi-user roles, bulk documents, accounting API | Cyprus is SME-dense |
| **Merchant payments** | Merchant | QR acceptance, instant settlement view, refunds | Interchange-style fee per transaction |
| **Institutional partnerships** | Government / agencies | A modern, accessible front end and secure delivery channel for existing services | Fee for integration and operation, not per citizen |
| **Value-added financial services** | Citizen (opt-in) | Insurance and credit comparison, savings products via licensed partners | Referral or distribution fees, always disclosed |

Explicitly rejected: selling or brokering personal data, advertising against government content, and
any charge that sits between a citizen and a public service.

## Unit economics sketch

Cyprus has roughly 950k residents. A realistic five-year ambition is 250–350k registered users
(a quarter to a third of the population, in line with what national ID and payment apps achieve in
small European markets), with 8–12% on Premium and a few thousand business accounts.

At 300k users, 10% premium conversion and 4,000 business accounts, subscription revenue alone is
roughly €2.5m/year, before merchant payments. Costs are dominated by compliance, licensing and
support rather than infrastructure — which is why the roadmap sequences licences deliberately
instead of building everything at once.

## Go to market

1. **Identity and documents first.** Free, useful without any bank, and the reason to open the app
   the first time.
2. **Government directory as the daily hook.** Road tax, MOT, licence renewals, tax deadlines and
   GHS services generate the reminders that bring people back.
3. **Money once open banking is licensed.** Balances beside the bills that are already in the app.
4. **Merchants after payments.** Local businesses accept QR; the consumer base is already there.
5. **Institutions last, from a position of adoption.** A department integrates because citizens are
   already using the channel.

## Why an institution would partner

- A modern, accessible, multilingual front end without rebuilding their portal.
- Fewer in-person visits and fewer failed submissions, because required documents are checked
  against the citizen's vault before submission.
- Delivery of official notifications to a channel citizens actually read.
- Clear provenance: every service shows which department owns it and links to the official site.

## Why a bank would partner

- Distribution to an engaged base without building a super-app.
- Account aggregation makes the bank present in a daily context.
- Merchant and SME products reach customers who are already verified.

## Risks

| Risk | Response |
| --- | --- |
| Government builds its own super-app | Interoperate, do not compete: link out honestly, add value in money and documents |
| Licensing takes longer than planned | The product is useful without money features; identity and government come first |
| Trust failure | Radical honesty about what is and is not connected — the badge system in this prototype is the product principle, not a demo device |
| Small market | Architecture is not Cyprus-specific below the catalogue; Malta, Greece and other small EU markets are structurally similar |
