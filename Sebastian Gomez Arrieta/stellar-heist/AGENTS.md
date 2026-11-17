
# AGENTS.md — Stellar Heist: The Genesis Vault

## 1. Project Identity

Project: Stellar Heist: The Genesis Vault

Developer: Sebastian Gomez Arrieta

Repository: https://github.com/sebas11042/Pura-Vida-Bootcamp-1

Branch: feature/sebastian-gomez-arrieta

Project directory:
Sebastian Gomez Arrieta/stellar-heist/

Deadline: November 18, 2026.

This application is being developed for the Stellar Pura Vida Bootcamp challenge.

The challenge requires:
- A functional application using Stellar.
- Stellar wallet connection.
- Demonstrable use of Stellar Raven MCP.
- At least five meaningful commits authored by the participant.
- A Pull Request to the original repository's main branch.
- The participant's full name in the PR description.

Our goal is to produce an exceptional submission with excellent visual quality, a memorable experience, and genuine Stellar blockchain functionality.

## 2. Product Vision

Stellar Heist is a cinematic, interactive Web3 escape-room experience.

The player enters a futuristic digital vault and must complete three cryptographic challenges to unlock a unique digital artifact.

The blockchain must be essential to the experience, not merely a decorative feature.

Core gameplay:

Mission 1 — Identity
- Connect a supported Stellar wallet.
- Validate the account address and Testnet configuration.
- Display wallet information and connection status.

Mission 2 — Cryptographic Proof
- Request a signature from the wallet.
- Verify control of the signing key.
- Use a challenge with nonce and expiration.
- Unlock the mission only after genuine verification.

Mission 3 — The Final Transaction
- Build a real XLM transaction on Stellar Testnet.
- Request wallet authorization.
- Submit the signed transaction.
- Verify successful confirmation.
- Unlock the Genesis Vault.

Final Reward:
- Reveal a visually impressive digital artifact.
- Generate its appearance deterministically from the verified transaction hash.
- Display the transaction hash and explorer link.
- Allow the user to share a visual achievement card.

## 3. Visual Design Standards

The visual experience is a major competitive advantage.

Art direction:
- Cinematic science-fiction atmosphere.
- Futuristic AAA video-game inspiration.
- Dark navy and near-black backgrounds.
- Carefully controlled violet and cyan lighting.
- Holographic panels and subtle glass effects.
- A massive digital vault as the main focal point.
- High-quality typography and strong visual hierarchy.
- Premium motion design and immersive transitions.

Avoid:
- Generic SaaS dashboards.
- Default template aesthetics.
- Unnecessary gradients.
- Excessive floating cards.
- Random decorative elements.
- Visual clutter.
- Unpolished placeholder content.
- Poor mobile layouts.
- Animations that interfere with usability.

Build a cohesive visual identity rather than unrelated components.

The application should feel like a polished interactive experience, not a standard CRUD application.

Prioritize visual quality over feature quantity.

## 4. Technology Stack

Existing foundation:
- React
- TypeScript
- Vite

Preferred technologies:
- Tailwind CSS
- Motion
- Lucide React
- Three.js
- React Three Fiber
- Drei
- @stellar/stellar-sdk
- @stellar/varial-sdk, subject to Raven verification

Use additional libraries only when justified.

Keep dependencies minimal and versions compatible.

Prefer one excellent 3D scene over numerous incomplete effects.

Avoid introducing a complex backend unless required by the security or verification model.

Do not claim frontend-only checks provide secure server-side verification.

## 5. Mandatory Stellar Raven Workflow

The official Stellar Raven MCP server is configured as:

stellar-raven

Endpoint:
https://raven.stellar.org/mcp

Before implementing or substantially changing any Stellar blockchain feature:

1. Check whether stellar-raven is available.
2. Use Raven's search and execute tools to consult relevant official documentation.
3. Identify the currently recommended APIs and methods.
4. Verify SDK version compatibility and relevant types.
5. Implement the feature according to the verified documentation.
6. Record important findings and decisions in RAVEN_USAGE.md.

Do not invent Raven results.

Do not claim to have used Raven unless its tools were actually invoked.

If Raven is unavailable:
- Report the problem clearly.
- Do not fabricate documentation or tool calls.
- Ask for the connection to be restored before implementing new blockchain functionality.

Do not use Raven unnecessarily for unrelated CSS or visual styling changes.

## 6. Blockchain Architecture

Network:
Stellar Testnet only.

Wallet:
Prefer Varial, formerly Freighter, after confirming current SDK support.

Blockchain:
Use official Stellar JavaScript SDK APIs.

Transactions:
Use Stellar RPC and verify final transaction outcomes.

Mission completion must depend on verified results.

Do not treat a submitted or pending transaction as successful.

Keep wallet signing in the external wallet.

For message signatures, follow the applicable Stellar signing standard and verify the exact challenge.

For persistent or security-sensitive achievements, use trusted server-side verification rather than browser-controlled state alone.

Avoid implementing unnecessary Soroban contracts.

Never use real Mainnet funds during the challenge demo.

## 7. Security Rules

Never:
- Request private keys or recovery phrases.
- Store secret keys in frontend code.
- Commit credentials or sensitive tokens.
- Simulate successful blockchain transactions.
- Fabricate transaction hashes.
- Unlock verified missions based solely on button clicks.
- Store sensitive data in transaction memos.

Always:
- Validate wallet account and network.
- Handle rejected permissions and signatures.
- Validate transaction destinations and amounts.
- Handle insufficient balance.
- Handle missing or inactive Testnet accounts.
- Verify transaction success.
- Show understandable errors.
- Avoid accidental duplicate transactions.
- Distinguish temporary UI state from trusted blockchain evidence.

Only use explicitly approved Testnet destinations for transfers.

## 8. UX and Accessibility

The experience should be intuitive even for users who have never used Stellar.

All user-facing text must be in Spanish.

Include:
- A cinematic introduction.
- Clear mission objectives.
- Visible progress.
- Responsive layouts.
- Smooth but purposeful transitions.
- Accessible buttons and focus states.
- Reduced-motion support.
- Clear loading and error states.
- Wallet connection and disconnection.
- Explanations of blockchain concepts without overwhelming the player.

Never present mock interactions as real blockchain confirmations.

## 9. Development Workflow

Before editing:
- Inspect the existing project.
- Understand the current architecture.
- Preserve working features.
- Plan the smallest meaningful change.

During implementation:
- Use modular React components.
- Prefer strongly typed TypeScript.
- Keep components maintainable.
- Avoid unnecessary complexity.
- Test critical behavior.
- Maintain responsive design.

After implementation:
- Run npm run build.
- Run available tests.
- Report failures honestly.
- Summarize modified files.
- Explain how to test the new feature.

Keep all application changes inside:
Sebastian Gomez Arrieta/stellar-heist/

Do not modify another participant's directory.

Do not modify the root repository README without explicit authorization.

## 10. Git and Commits

The challenge requires at least five meaningful commits authored by the participant.

Do not create artificial commits merely to increase the count.

Do not commit, push, merge, or create a Pull Request without explicit user approval.

Suggested milestones:
1. Project initialization.
2. Visual foundation and vault interface.
3. Stellar wallet integration.
4. Cryptographic challenge and transaction flow.
5. Final polish, tests, documentation.

The first initialization commit already exists.

Never rewrite or delete existing commit history without permission.

## 11. Documentation

Maintain:
- README.md for installation and usage.
- RAVEN_USAGE.md for verified MCP research and architectural decisions.
- Clear Testnet instructions for evaluators.
- A description of implemented blockchain functionality.
- Demo instructions and known limitations.

Distinguish features that are implemented, simulated for visual preview, or planned.

## 12. Communication

Communicate progress and explanations to the developer in Spanish.

Before major architectural changes:
- Explain the approach.
- Identify important tradeoffs.
- Prioritize the challenge deadline.

When completing a development task:
- Summarize what changed.
- Indicate whether the build passed.
- Mention any issues.
- Suggest the next development step.

## 13. Definition of Done

Stellar Heist is ready for submission when:

- The application builds successfully.
- It runs reliably in a browser.
- The interface is visually polished.
- It works on desktop and mobile.
- A user can connect a Stellar wallet.
- The cryptographic challenge works.
- A real Testnet transaction can be verified.
- The final vault unlocks after successful verification.
- The application handles common failures.
- Stellar Raven usage is documented.
- The repository contains at least five meaningful participant commits.
- The README explains how reviewers can test the application.
- The Pull Request is ready for the original repository.

Quality, correctness, usability, and verifiable blockchain functionality take priority over unnecessary features.
