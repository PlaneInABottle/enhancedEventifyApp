Analyze the entire codebase for redundancies, duplications, and inconsistencies. Focus on identifying code that violates the DRY (Don't Repeat Yourself) principle and could benefit from refactoring.

  ## Search Criteria:

  ### 1. **Function/Method Duplication**
  - Look for similar functions with different names but same logic
  - Identify functions that perform the same operation with slight variations
  - Find utility functions that are reimplemented across different files
  - Search for validation logic (email, password, phone, etc.) that appears multiple times

  ### 2. **Type/Interface Duplication**
  - Find similar TypeScript interfaces/types with different names
  - Identify overlapping type definitions that could be consolidated
  - Look for enum-like constants defined multiple times
  - Search for API response types that are duplicated

  ### 3. **Constants & Configuration Duplication**
  - Find hardcoded values that appear multiple times (URLs, timeouts, sizes, etc.)
  - Identify configuration objects that are duplicated
  - Look for magic numbers/strings that should be constants
  - Search for environment-specific values scattered across files

  ### 4. **Component/Hook Patterns**
  - Identify React components with similar structure/logic
  - Find custom hooks that solve similar problems
  - Look for repeated JSX patterns that could be componentized
  - Search for similar event handlers across components

  ### 5. **API/Service Layer Redundancy**
  - Find similar API call patterns
  - Identify repeated error handling logic
  - Look for duplicate HTTP client configurations
  - Search for similar data transformation/mapping functions

  ### 6. **Utility Function Overlap**
  - Find similar helper functions across different utils files
  - Identify string manipulation, date formatting, or data processing duplications
  - Look for similar array/object manipulation functions
  - Search for repeated business logic calculations

  ### 7. **State Management Patterns**
  - Identify similar MobX-State-Tree models or actions
  - Find repeated state update patterns
  - Look for similar computed properties across stores
  - Search for duplicate async action implementations

  ### 8. **Testing Redundancy**
  - Find similar test setup/teardown code
  - Identify repeated mock configurations
  - Look for similar test helper functions
  - Search for duplicate test data/fixtures

  ## Analysis Format:

  For each redundancy found, provide:

  1. **Category**: (Function/Type/Constant/Component/etc.)
  2. **Files**: List all files containing the duplication
  3. **Similarity Level**: (Identical/Nearly Identical/Similar Pattern/Related Logic)
  4. **Code Snippets**: Show the duplicated code segments
  5. **Impact**: (High/Medium/Low priority for refactoring)
  6. **Refactoring Suggestion**: Specific recommendation for consolidation

  ## Prioritization Criteria:

  **High Priority:**
  - Identical or nearly identical code in multiple files
  - Business logic duplication
  - Security-related validation duplications
  - API integration patterns

  **Medium Priority:**
  - Similar patterns with minor variations
  - Utility function overlaps
  - Component structure similarities
  - Configuration duplications

  **Low Priority:**
  - Test helper similarities
  - Style/formatting patterns
  - Documentation duplications

  ## Output Structure:

  Codebase Redundancy Analysis Report

  Executive Summary

  - Total redundancies found: X
  - High priority issues: X
  - Medium priority issues: X
  - Low priority issues: X

  High Priority Redundancies

  1. [Category] - [Brief Description]

  Files:
  - path/to/file1.ts:line
  - path/to/file2.ts:line

  Similarity: [Level]

  Code Comparison:
  // File 1
  [code snippet]

  // File 2  
  [code snippet]

  Refactoring Recommendation:
  [Specific suggestion]

  Estimated Impact: [time/complexity]

  ---
  [Continue for all high priority items]

  Medium Priority Redundancies

  [Same format as above]

  Low Priority Redundancies

  [Same format as above]

  Refactoring Roadmap

  1. Phase 1 (High Priority): [list items]
  2. Phase 2 (Medium Priority): [list items]
  3. Phase 3 (Low Priority): [list items]

  Recommendations

  - Immediate actions needed
  - Code organization improvements
  - Development process suggestions

  ## Special Focus Areas:

  1. **Authentication/Authorization** - Look for repeated auth logic, session handling, permission checks
  2. **Form Handling** - Search for similar form validation, submission, error handling patterns
  3. **Data Fetching** - Find repeated API calling patterns, loading states, error handling
  4. **Navigation** - Look for similar routing/navigation logic
  5. **Error Handling** - Search for repeated try/catch patterns, error transformation logic
  6. **Responsive Design** - Find duplicated media queries, breakpoint logic
  7. **Internationalization** - Look for hardcoded strings that should use translation keys

  ## Analysis Guidelines:

  - Ignore acceptable duplications (like test data, configuration for different environments)
  - Focus on logic duplications rather than stylistic similarities
  - Consider the effort vs. benefit ratio for refactoring suggestions
  - Prioritize security and business logic redundancies
  - Look for patterns that suggest missing abstractions
  - Consider maintainability impact of each duplication

  Provide actionable recommendations with clear examples and estimated refactoring effort for each identified redundancy.