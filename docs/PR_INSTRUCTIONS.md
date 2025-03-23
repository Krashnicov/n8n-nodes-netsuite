# Pull Request Instructions for n8n-nodes-netsuite

This document provides guidance for contributors looking to submit Pull Requests to the n8n-nodes-netsuite repository.

## Prerequisites
- Ensure you have Node.js 18.17+ installed
- Familiarity with TypeScript and n8n node development
- Basic understanding of NetSuite REST API

## Development Setup
1. Clone the repository
   ```bash
   git clone https://github.com/drudge/n8n-nodes-netsuite.git
   cd n8n-nodes-netsuite
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Build the project
   ```bash
   pnpm build
   ```

4. Run linting
   ```bash
   pnpm lintfix
   ```

## Development Workflow
1. Create a new branch from main
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes to the codebase

3. Use the development script for real-time compilation during development
   ```bash
   pnpm dev
   ```

4. Before committing:
   - Run linting to ensure code quality
     ```bash
     pnpm lintfix
     ```
   - Verify the build works correctly
     ```bash
     pnpm build
     ```

   - Generate and update the codebase index
     ```bash
     pnpm codebase-index
     ```
     
   - Ensure the updated `docs/codebase-index.json` file is included in your commit

5. Commit your changes with descriptive messages
   ```bash
   git commit -m "feat: Add support for XYZ"
   ```

## Pull Request Process
1. Push your branch to GitHub
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request against the main branch
   - Visit the repository on GitHub
   - Click "New Pull Request"
   - Select your branch

3. Complete the PR template with:
   - Summary of changes
   - Link to related issues
   - Verification steps
   - Screenshots/output logs from tests and linting

4. Apply appropriate labels:
   - `enhancement` for new features
   - `bug` for bug fixes
   - `documentation` for documentation updates
   - `testing` for test improvements

5. Wait for code reviews and address any feedback

6. Codebase Index
- Every PR submission **must include** an updated codebase index (`docs/codebase-index.json`) 
- Run `pnpm codebase-index` locally before creating a PR
- If you've made changes that affect the codebase structure, verify that the index is updated

## Testing
The repository uses Jest for automated testing. When submitting a PR:
- Run `pnpm test` to ensure all tests pass
- Include test coverage reports with `pnpm test:coverage`
- For new features, add appropriate tests in the corresponding `__tests__` directory
- Attach screenshots or logs of your testing results

## Documentation
For significant changes, update documentation in the `/docs` directory:
- Update API documentation for endpoint changes
- Add examples for new functionality
- Update configuration instructions if needed

## Release Process
The repository maintainers will handle version increments and releases after merging PRs.
