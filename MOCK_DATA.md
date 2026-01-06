# Mock Data for The Jironaut Demo

This file contains example Jira tickets of varying quality for demonstrating The Jironaut's analysis capabilities.

---

## 🟢 High-Scoring Story (85%+)

**Type:** Story  
**Work Type:** Front-end, Back-end

**Title:** Enable guest checkout to reduce cart abandonment for mobile users

**Description:**

### User Story
As a mobile shopper without an account, I want to complete my purchase as a guest, so that I don't abandon my cart due to account creation friction.

### Business Value
Current data shows 28% cart abandonment rate on mobile, with exit surveys indicating "forced account creation" as the top reason (cited by 62% of abandoners). This represents approximately £85k/month in lost revenue. Enabling guest checkout is projected to reduce mobile cart abandonment by 15 percentage points, yielding ~£30k/month additional revenue.

### Acceptance Criteria
- Given a user on the checkout page, when they select "Continue as Guest", then they can complete purchase without creating an account
- Given a guest checkout, when the order is complete, then the user receives a confirmation email with their order details
- Given a guest who completed checkout, when they return to the site, then they are offered the option to create an account to track their order
- Given a guest checkout, when an error occurs, then appropriate error messages are displayed and the user's cart data is preserved

### Technical Approach
- Create new guest checkout flow alongside existing authenticated flow
- Store guest order data with hashed email as identifier
- Implement session-based cart persistence for guest users
- Add analytics tracking for guest vs authenticated conversion rates

### Dependencies
- PROJ-456: Payment API v2 upgrade (blocked - in progress, expected completion 15 Jan)
- PROJ-789: Session management refactor (ready)
- External: Stripe guest payment support (available)

### Accessibility
- Keyboard navigation for all checkout steps
- Screen reader announcements for cart updates and errors
- WCAG 2.1 AA compliant form validation
- Focus management through multi-step flow

### Release Strategy
- Feature toggle: `enable_guest_checkout` (off by default)
- Phased rollout: 5% → 25% → 50% → 100% over 2 weeks
- AB test tracked in Amplitude: guest_checkout_experiment
- Rollback plan: toggle off, users redirected to account creation

### Testing Strategy
- Unit tests: guest session management, cart persistence
- Integration tests: full checkout flow with test Stripe account
- E2E tests: happy path, error scenarios, accessibility checks
- Load testing: 1000 concurrent guest checkouts
- Manual QA on iOS Safari, Android Chrome, desktop browsers

### Observability
- Track guest checkout conversion rate vs authenticated (target: +15%)
- Monitor cart abandonment at each step
- Alert if guest checkout error rate >2%
- Dashboard: real-time guest checkout funnel in Datadog

### Risk Assessment
- Security: guest orders associated with email only - implement rate limiting to prevent email enumeration
- Performance: additional session data - verified acceptable load in staging
- Legal: GDPR compliance for guest data - reviewed by legal team, 30-day retention approved

### Non-Functional Requirements
- Page load time: <2s on 3G
- Checkout completion: <30s
- Error recovery: preserve cart data for 24 hours

---

## 🟡 Medium-Scoring Bug (65-75%)

**Type:** Bug  
**Work Type:** Back-end

**Title:** Payment processing fails intermittently for orders over £5,000

**Description:**

### Impact
Production environment affected. Approximately 8-12 high-value orders per day failing. Issue is intermittent - roughly 40% of large orders fail on first attempt. Customer support receiving complaints.

### Who Reported
Customer Support team (Sarah from CS) after 7 customer complaints over 3 days. Impacts primarily B2B customers placing bulk orders.

### Environment
- Production only
- Started after v2.4.1 deployment (Nov 18)
- Does NOT reproduce in staging or dev

### Reproduction Steps
1. Log in as user with verified payment method
2. Add items to cart totaling £5,000-£10,000
3. Proceed to checkout
4. Enter valid payment details
5. Click "Complete Purchase"
6. ~40% of the time: Error "Payment processing failed, please try again"

### Expected Behavior
Transaction should process successfully for amounts up to £50,000 (our merchant limit)

### Actual Behavior
Some transactions over £5,000 fail with generic error. Retry often succeeds. No pattern identified yet regarding which fail vs succeed.

### Additional Context
- Error logs show: `PaymentProcessorException: Amount validation failed`
- Stripe dashboard shows these transactions never reach payment provider
- Related to recent payment service changes in v2.4.1
- No correlation with time of day, browser type, or specific products

### Proposed Investigation
- Review amount validation logic in payment service
- Check if currency conversion is causing decimal issues
- Verify merchant account limits haven't changed
- Add detailed logging around payment validation

---

## 🟠 Low-Scoring Feature (45-55%)

**Type:** Feature  
**Work Type:** Front-end, Back-end

**Title:** Improve dashboard

**Description:**

We need a better dashboard. The current one is outdated and doesn't show the metrics that management wants to see. 

Management has been asking for this for a while. They want to see sales data, user activity, and other important stuff in real-time.

The new dashboard should look modern and be easy to use. We should probably use some kind of charts library to make it look nice. Maybe add some graphs and stuff.

This is important because people need to make data-driven decisions and the current dashboard doesn't help with that.

We should start working on this soon because management keeps asking about it.

---

## 🔴 Very Low-Scoring Task (30-40%)

**Type:** Task  
**Work Type:** Back-end

**Title:** Fix API

**Description:**

The API is having issues and needs to be fixed. Users are complaining.

Need to look into this and fix whatever is broken.

---

## 🟢 High-Scoring Bug (80%+)

**Type:** Bug  
**Work Type:** Front-end

**Title:** Screen reader users cannot complete product search on iOS VoiceOver

**Description:**

### Severity
High - Accessibility blocker affecting 3-5% of users

### Impact
Consistent and reproducible on all iOS devices with VoiceOver enabled. Affects production environment. Based on analytics, approximately 2,400 users/month attempt product search with VoiceOver enabled.

### Who Reported
Accessibility audit (conducted Dec 2024) flagged this as a WCAG 2.1 Level A violation. Confirmed by user testing with blind user Sarah M. Also reported via accessibility@company.com by 3 external users.

### Environment
- Production and Staging
- iOS 16+ with VoiceOver enabled
- All browsers (Safari, Chrome, Firefox)
- Does NOT affect Android TalkBack

### Reproduction Steps
1. Enable VoiceOver on iOS device (Settings → Accessibility → VoiceOver)
2. Navigate to homepage
3. Swipe to search input field
4. Double-tap to activate
5. Attempt to type search query using keyboard
6. Observe: VoiceOver announces "search" but input field does not receive focus
7. Typed characters not captured
8. Search cannot be completed

### Expected Behavior
- VoiceOver should announce "Search products, text field"
- Double-tap should focus the input
- Keyboard input should be captured
- Search results should be announced to screen reader
- Search button should be reachable and activatable

### Actual Behavior
- Input field is announced but cannot receive focus
- Typed text disappears
- No way to submit search
- VoiceOver users are completely blocked from searching

### Technical Investigation
- Issue caused by custom React component overriding native input behavior
- `aria-hidden="true"` incorrectly applied to input wrapper
- Missing `aria-label` on input element
- Search button lacks proper ARIA attributes

### Root Cause
PROJ-567 (search redesign, deployed Nov 15) introduced custom component that broke screen reader compatibility. Code review missed accessibility implications.

### Proposed Fix
1. Remove `aria-hidden` from input wrapper
2. Add `aria-label="Search products"` to input
3. Add `aria-live="polite"` region for search results
4. Ensure focus management on search activation
5. Add keyboard event handlers for Enter key submission

### Testing Strategy
- Manual testing with VoiceOver on iPhone 15, iPad Air
- Automated: axe-core accessibility tests
- User testing: confirm with Sarah M. from user testing session
- Regression testing: verify Android TalkBack still works

### Dependencies
None - can be implemented immediately

### Acceptance Criteria
- VoiceOver users can focus search input
- Typed text is announced and captured
- Search can be submitted via double-tap or Enter key
- Search results are announced to screen reader
- Passes axe-core automated tests
- Confirmed working by accessibility SME

### Risk Assessment
- Low risk change - only affects input attributes
- No backend changes required
- Can be deployed independently
- Rollback: revert to previous component version

### Compliance
Fixes WCAG 2.1 Level A violation (4.1.2 Name, Role, Value). Required for accessibility compliance and legal risk mitigation.

### Observability
- Add analytics: track screen reader search attempts vs completions
- Monitor error rate for screen reader users
- Alert if screen reader search success rate <95%

---

## 🟡 Medium-Scoring Spike (60-70%)

**Type:** Spike  
**Work Type:** Back-end, DevOps

**Title:** Investigate GraphQL migration for product API

**Description:**

### Context
Current REST API has performance issues with nested product data. Frontend makes 5-8 separate API calls to render product detail page. Leadership interested in GraphQL but wants data before committing.

### Learning Goal
Evaluate whether GraphQL would improve performance and developer experience for our product API, and identify implementation complexity.

### Questions to Answer
1. What would performance improvement be for typical product detail page load?
2. What's the learning curve for team (3 backend devs, 4 frontend devs)?
3. How would this affect our caching strategy?
4. What's the migration effort (days/weeks)?
5. Are there better alternatives to GraphQL for our use case?

### Timebox
5 days (Jan 8-12)

### Expected Deliverable
- Written report with findings and recommendation
- Simple proof-of-concept: GraphQL endpoint for product query
- Performance comparison: REST vs GraphQL for product detail page
- Migration effort estimate with risks identified
- Present findings to team in tech talk (Jan 15)

### Approach
- Day 1-2: Research GraphQL implementations (Apollo, Relay, etc.)
- Day 3: Build POC with subset of product data
- Day 4: Performance testing and comparison
- Day 5: Write report and prepare presentation

### Success Criteria
- Team can make informed decision on GraphQL adoption
- Have working POC to demo
- Identified at least 3 risks/concerns
- Quantified performance impact with numbers

---

## 🔴 Terrible Spike (20-30%)

**Type:** Spike  
**Work Type:** Other

**Title:** Research stuff

**Description:**

Look into new technologies and see what's out there. Maybe AI or blockchain or something modern.

Figure out what we should be using and report back.

---

## 🟢 High-Scoring Tech Debt (75-85%)

**Type:** Tech Debt  
**Work Type:** Back-end

**Title:** Migrate authentication service from custom tokens to OAuth 2.0

**Description:**

### Justification
Our authentication system uses a custom JWT implementation built in 2019. This creates multiple problems:
- Only 2 engineers understand the codebase (knowledge risk)
- No SSO support for enterprise customers (blocking £250k+ deals)
- Security audit flagged as "concerning" due to non-standard crypto
- Each new auth feature takes 3-5 extra days to implement
- Cannot integrate with third-party identity providers
- Difficult to implement MFA with current architecture

### Current Impact
**Development Velocity:**
- Auth-related features take 2-3x longer than industry standard
- 15% of support tickets relate to auth issues
- Cannot support Google/Microsoft SSO (requested by 8 enterprise prospects)

**Business Impact:**
- Lost 2 enterprise deals worth £280k due to lack of SSO
- Security audit remediation required before SOC2 certification
- Recruitment challenge: candidates expect modern auth standards

**Technical Debt:**
- 12,000 lines of custom auth code
- No automated security testing
- Manual token rotation process
- Limited session management capabilities

### Impact if NOT Addressed
**Within 6 months:**
- Will fail SOC2 audit (required for enterprise sales)
- Continue losing enterprise deals to competitors
- Technical debt compounds as more features build on legacy system
- Risk of security breach increases
- Engineer turnover risk (outdated tech stack)

**Within 12 months:**
- Compliance issues may block all enterprise sales
- Major refactor becomes 3x more expensive
- May need to rewrite dependent systems

### Proposed Approach
**Phase 1 (2 weeks):** Proof of concept with Auth0
- Implement OAuth 2.0 alongside existing system
- Test with 5% of users
- Measure performance and reliability

**Phase 2 (3 weeks):** Gradual migration
- Migrate internal users first
- Roll out to 10% → 50% → 100% of customers
- Maintain backwards compatibility

**Phase 3 (1 week):** Cleanup
- Deprecate legacy auth endpoints
- Remove custom auth code
- Update documentation

**Total Effort:** 6 weeks with 2 engineers

### Technical Approach
- Evaluate Auth0, AWS Cognito, Azure AD B2C
- Implement OAuth 2.0 authorization code flow
- Add PKCE for mobile apps
- Support refresh token rotation
- Migrate existing user sessions without forcing logout

### Dependencies
- PROJ-789: User database schema migration (in progress)
- PROJ-801: Session management refactor (ready)
- External: Auth0 enterprise plan (budget approved)

### Risk Assessment
**High Risk:**
- User logout/re-authentication during migration (mitigation: gradual rollout)
- Integration with 6 internal systems that depend on auth (mitigation: maintain compatibility layer)

**Medium Risk:**
- Learning curve for team on OAuth 2.0 (mitigation: 2-day training session scheduled)
- Performance impact from external auth service (mitigation: tested in POC, acceptable)

**Low Risk:**
- Third-party service dependency (mitigation: Auth0 has 99.99% uptime SLA)

### Testing Strategy
- Security testing: penetration test by external firm
- Load testing: 10k concurrent auth requests
- Integration testing: all dependent systems
- User acceptance testing: internal users first

### Success Metrics
- Zero security vulnerabilities in auth flow
- Auth-related support tickets reduced by 80%
- Time to implement auth features reduced by 60%
- Enterprise SSO support enables 3+ deals

### Compliance
- Required for SOC2 certification
- Addresses security audit findings
- GDPR compliant session management

---

## Usage Notes

**Score Ranges:**
- 🟢 85%+ (Excellent) - Ready for development
- 🟡 70-84% (Good) - Minor improvements needed
- 🟠 50-69% (Fair) - Significant gaps to address
- 🔴 <50% (Poor) - Major rework required

**What Makes Tickets Score High:**
1. Clear, goal-oriented title with context
2. Well-articulated value/impact with metrics
3. Specific, testable acceptance criteria
4. Identified dependencies with links/status
5. Risk assessment and mitigation strategies
6. Accessibility considerations (for front-end)
7. Testing strategy with specifics
8. Observability and monitoring plans
9. Non-functional requirements addressed
10. Type-specific criteria met (varies by ticket type)

**What Causes Low Scores:**
1. Vague titles ("Fix API", "Improve dashboard")
2. No business value or impact quantified
3. Missing acceptance criteria
4. No dependencies identified
5. No risk assessment
6. No testing strategy
7. Technical jargon without stakeholder context
8. No observability/metrics mentioned
9. Missing type-specific requirements
10. Lack of specific deliverables

Copy these tickets into The Jironaut to see different quality levels analyzed!
