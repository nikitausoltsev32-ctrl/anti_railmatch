# Claude Code Configuration

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- NEVER save to root folder — use the directories below
- Use `/src` for source code files
- Use `/tests` for test files
- Use `/docs` for documentation and markdown files
- Use `/config` for configuration files
- Use `/scripts` for utility scripts
- Use `/examples` for example code

## Build & Test

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

- ALWAYS run tests after making code changes
- ALWAYS verify build succeeds before committing

## Knowledge Graph & Documentation

- When creating new files, always link them to related vault files using [[backlinks]] syntax
- Use [[filename]] to reference related files, features, or concepts in documentation
- Keep backlinks bidirectional where applicable to maintain a well-connected knowledge graph

## Graphify Rules

- Use `/graphify` to add knowledge to the graph when working with:
  - New features or components
  - Architecture decisions
  - Integration patterns
  - Important concepts or relationships
  - Cross-cutting concerns
- Structure graphify input clearly:
  - Start with the main concept/entity
  - Include relevant relationships (depends on, related to, implements, etc.)
  - Link to existing nodes when possible for better graph coherence
- Extract semantic meaning, not just syntax — focus on "what does this do" not "what are the keywords"

## Security Rules

- NEVER hardcode API keys, secrets, or credentials in source files
- NEVER commit .env files or any file containing secrets
- Always validate user input at system boundaries
- Always sanitize file paths to prevent directory traversal
