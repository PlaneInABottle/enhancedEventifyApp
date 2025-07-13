**ROLE**: Senior QA Engineer and Test Architecture Analyst

  **TASK**: Analyze our React Native authentication test suites to identify missing test scenarios, potential bugs, and gaps in our testing coverage that could lead to production issues.

  **CONTEXT**:
  We have a React Native app with Login and SignUp screens using:
  - MobX-State-Tree for state management (AuthenticationStore)
  - React Navigation for screen transitions
  - Supabase for authentication backend
  - Jest + React Testing Library for testing

  We recently discovered critical bugs:
  1. LoginScreen doesn't display authentication errors from the store
  2. Error state persists across screen navigation (Login → SignUp)

  **FILES TO ANALYZE**:
  - `app/__tests__/screens/LoginScreen.test.tsx`
  - `app/__tests__/screens/SignUpScreen.test.tsx`
  - `app/screens/LoginScreen.tsx`
  - `app/screens/SignUpScreen.tsx`
  - `app/stores/AuthenticationStore.ts`

  **ANALYSIS FRAMEWORK**:

  ## 1. **Cross-Screen State Management Gaps**
  - Are we testing state persistence/cleanup between screen transitions?
  - Do tests verify error state is cleared when navigating between screens?
  - Are we testing shared store state behavior across different components?

  ## 2. **Error Display Consistency**
  - Do both Login and SignUp screens have consistent error handling tests?
  - Are we testing that all error types from AuthenticationStore are properly displayed?
  - Do tests verify error message visibility and user feedback?

  ## 3. **Authentication Flow Integration**
  - Are we testing the complete user journey (Login failure → navigate to SignUp)?
  - Do tests cover edge cases like network errors, session expiry, invalid tokens?
  - Are we testing authentication state changes and their UI impact?

  ## 4. **Store-Component Integration**
  - Do tests verify that all store state changes are reflected in UI?
  - Are we testing that user actions properly update store state?
  - Do tests cover scenarios where store and component state might diverge?

  ## 5. **Navigation and Lifecycle**
  - Are we testing screen focus/blur events and their effects on state?
  - Do tests verify proper cleanup when screens unmount?
  - Are navigation-triggered state changes tested?

  ## 6. **Missing Scenarios**
  Look for these common missing test patterns:
  - Error state cleanup on component unmount
  - Multiple rapid user interactions (button mashing, quick navigation)
  - Authentication state changes while on different screens
  - Form state preservation during navigation
  - Loading state behavior during screen transitions

  **OUTPUT FORMAT**:

  ```markdown
  ##  MISSING TEST SCENARIOS ANALYSIS

  ### 1. **Critical Gaps Found**
  - [List specific missing test scenarios that could cause bugs]

  ### 2. **Cross-Screen State Issues**
  - [Identify state management problems between screens]

  ### 3. **Error Handling Inconsistencies**
  - [Compare error handling between Login and SignUp screens]

  ### 4. **Integration Test Gaps**
  - [Missing tests for store-component-navigation integration]

  ### 5. **Recommended Test Cases to Add**
  ```typescript
  // Example missing test case
  describe("Cross-Screen Error State", () => {
    it("should clear login errors when navigating to signup", () => {
      // Test implementation suggestion
    })
  })

  6. Bug Risk Assessment

  - HIGH RISK: [Scenarios likely to cause production bugs]
  - MEDIUM RISK: [Edge cases that could cause issues]
  - LOW RISK: [Nice-to-have test coverage]

  7. Test Architecture Improvements

  - [Suggestions for better test organization and coverage]

  **FOCUS AREAS**:
  - State management across screen boundaries
  - Error handling consistency and completeness
  - Authentication flow edge cases
  - User experience during error states
  - Component lifecycle and cleanup

  **GOAL**: Identify testing patterns that would have caught the current bugs and prevent similar issues in the future.```