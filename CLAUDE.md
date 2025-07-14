## React Best Practices

- Don't use class components in react, instead use modern functional components
- Use i18n translations instead of using hard coded text

## Modified Test-Driven Development (TDD) Workflow
**MANDATORY PROCESS - ONE FUNCTION AT A TIME:**
1. **Implement Function** - Write complete, well-typed function implementation
2. **Check TypeScript** - Run `npx tsc --noEmit` to ensure type safety
3. **Plan Test Scenarios** - Identify all test cases (happy path, edge cases, errors)
4. **Write Tests One by One** - Create comprehensive tests for each scenario
5. **Verify All Tests Pass** - Run tests after writing each one
6. **Refactor if Needed** - Improve code with tests as safety net
7. **Move to Next Function** - Complete one function before starting another

**Test Commands:**
- Frontend: `npm test`, `npm run test:watch`
- Backend: `pytest`, `npm test`, `cargo test`
- TypeScript: `npx tsc --noEmit`
- Always run TypeScript check before writing tests

**Key Principles:**
- Implement complete, working functions first
- TypeScript safety is mandatory before testing
- Plan all test scenarios upfront
- One function at a time approach
- Tests should pass immediately (since function is implemented)