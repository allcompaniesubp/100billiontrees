# 200 Billion Trees

A global tree-planting, protection and ecosystem-restoration movement initiated by **Entire Space Absolute Foundation**, India.

**Founder:** Dr Ravi Prasad Ch  
**Motto:** Together for a Greener, Healthier and Peaceful World  
**Public website:** https://200billiontrees.unspuniversity.com/

## Mission

Bring individuals, families, schools, universities, NGOs, businesses, institutions and communities together to plant ecologically suitable trees, protect biodiversity and monitor long-term survival.

## Current platform

The Next.js application currently includes:

- Public homepage describing the 200-billion-tree long-term ambition.
- Founder profile and portrait.
- Organisation legal-status information.
- Country directory and introductory tree-suitability catalogue.
- Community information and moderated photo/video upload workflow.
- Email/password registration, email confirmation, sign-in and Google/GitHub OAuth through Supabase Auth.
- Pending member approval before community media uploads.
- Demonstration certificate page with visible non-issuance safeguards.

The platform intentionally does **not** present the global ambition as achieved progress. Public verified-tree and country-report counters remain zero until evidence is reviewed and published. Country directory entries do not imply participation or endorsement.

## Development

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Production build and lint:

```bash
npm run build
npm run lint
```

## Planned work

1. Reconcile checked-in Supabase migrations with the already-applied database migration history.
2. Build planting/project submissions, evidence review and transparent progress reporting.
3. Add expert-reviewed native species and regional suitability guidance.
4. Build authorised verifier workflows, certificate issuance, revocation and live QR validation.
5. Add coordinator applications, organisation registration and event management.
6. Consider nursery marketplace or donations only after legal, financial and provider approvals.
7. Add internationalisation, geospatial reporting and long-term survival monitoring.

## Environmental integrity

Reported planting, evidence-reviewed planting, independently verified planting and surviving trees are separate measures. A 30–60-day photograph is an early follow-up, not proof of permanent survival. Planting recommendations must be locally appropriate and avoid damage to naturally open ecosystems.

## Governance, privacy and safety

This is an independent initiative, not an official United Nations programme or government initiative. No endorsement is implied. External data must be used under its licence and terms.

Community media is stored privately and remains pending until moderation. Obtain permission for media and consent from identifiable people; avoid publishing private or sensitive location details. Do not collect identity documents, precise site coordinates or children's photographs without a reviewed necessity, privacy notice, consent process, retention policy and access controls.

No donations or payments are currently collected through this website. The Foundation has reported 12A and 80G approvals, but documentary verification and validity review are pending; the site must not promise tax deductibility or issue 80G receipts until verified. CSR-1 and FCRA status have not been confirmed.

## Deployment controls

Feature work is developed on `feature/community-media-certificate-polish`. Production branch changes, merges and deployments must remain subject to explicit owner approval.
