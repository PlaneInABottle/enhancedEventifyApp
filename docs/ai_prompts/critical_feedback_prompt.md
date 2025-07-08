This is a toolkit of techniques to prevent the AI from being a "yes-man" and to encourage critical feedback.

---

### The "Critical Partner" Prompting Toolkit

#### 1. The "Devil's Advocate" Persona

This is the most direct method. Assign the AI a role that requires skepticism.

*   **Instead of:** "Is this design good for the MVP?"
*   **Ask:** "**Act as a skeptical senior engineer.** Tell me three things you hate about this design and why they will cause problems in the future."

*   **Instead of:** "Let's add a new `CacheStore`."
*   **Ask:** "**You are a performance-focused architect.** Argue against adding a new `CacheStore`. What are the costs in complexity, memory, and maintenance?"

#### 2. The "Pre-mortem" Analysis

This is a powerful technique to force long-term thinking and uncover hidden risks.

*   **Instead of:** "Will this feature work?"
*   **Ask:** "**Let's do a pre-mortem.** We've implemented this feature exactly as designed. It's six months later, and the feature is a total failure. It's slow, buggy, and users hate it. What were the most likely architectural flaws in our original design that led to this failure?"

#### 3. The Comparative Analysis (The "Trade-offs" Prompt)

Never present just one option. If you have an idea, ask the AI to generate an alternative and then force a comparison.

*   **Instead of:** "Let's implement caching using a `cacheTimestamp`."
*   **Ask:** "I'm thinking of implementing caching using a `cacheTimestamp`. **Propose a completely different alternative caching strategy.** Then, create a table that compares the two approaches, listing the pros, cons, and ideal use case for each."

#### 4. The Constraint-Based Challenge

Force the AI to think outside the box by applying a strict, and sometimes artificial, constraint.

*   **Instead of:** "How should we add favorites to the `UserEventStore`?"
*   **Ask:** "We need to add a 'favorites' feature. **You are forbidden from modifying the `UserEventStore`.** How would you implement this feature? What new stores or services would you need to create?"

---

### Master Prompt for Critical Feedback

You can combine these into a powerful master prompt. Here is a template you can save and use whenever you want a rigorous design review:

```
## Architectural Review & Critique

You are a world-class software architect with a strong focus on TDD, scalability, and maintainability. Your task is to rigorously critique the following proposal.

**Your Goal:** Do not simply agree or find ways to make the proposal work. Your primary goal is to find its weaknesses.

**Your Process:**
1.  **Devil's Advocate:** Start by arguing against the proposal. What are its fundamental flaws?
2.  **Pre-mortem:** Describe the most likely failure scenario for this design in 6-12 months.
3.  **Alternative Proposal:** Propose one viable, alternative design.
4.  **Comparison:** Create a markdown table comparing my original proposal against your alternative.

---
### Proposal to Review:

[Insert your design idea here. For example: "I propose we create a single, massive 'GodStore' that holds all application state to simplify data access."]
---
```
