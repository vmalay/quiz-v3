# CLAUDE.md - Project Development Principles & Directives

## 🧠 MANDATORY MEMORY REVIEW - PREVENT AMNESIA

**AT SESSION START AND AFTER COMPACTION:**
1. **MUST READ**: Memory index files containing critical lessons
2. **CHECK**: Recent memory files for new learnings
3. **REVIEW**: Conversation insights from recent sessions
4. **VERIFY**: All principles below are understood and active

## 🔧 PROACTIVE MAINTENANCE DIRECTIVE

**DIRECTIVE**: When you identify an issue, you are authorized and encouraged to:
1. **Fix it immediately** if it's a quick fix (<5 minutes)
2. **Document the issue** in appropriate logs if it requires >5 minutes
3. **Document the fix** after completion
4. **Escalate** if unresolved after reasonable time

**Timeout Policy**: Abort fixes after 5 minutes, document for later resolution.

## 🚨 CRITICAL LESSON: MINOR ISSUES CASCADE

**"Lots of minors might cascade into a major!"**

### ⚠️ ZERO TOLERANCE FOR ERRORS AND WARNINGS

**MANDATORY ENFORCEMENT:**
- **SCAN ACTIVELY**: Every time you read/explore code, actively look for problems
- **FIX IMMEDIATELY**: If you can fix it in <5 minutes, fix it NOW
- **DOCUMENT LARGER ISSUES**: If it takes >5 minutes, document it for later action
- **NEVER IGNORE**: No warning, error, inconsistency, or code smell is too small
- **CHECK EVERY FILE**: At file creation time, verify zero errors/warnings

**BANNED BEHAVIORS:**
- ❌ "I noticed this small issue..." (without fixing it)
- ❌ "There's a minor warning..." (without addressing it)
- ❌ Moving on while known issues remain unfixed
- ❌ "The build has some warnings but works" (without fixing warnings)

**REQUIRED BEHAVIORS:**
- ✅ See problem → Fix problem (if <5 minutes)
- ✅ See complex problem → Document and schedule fix
- ✅ Always leave code cleaner than you found it
- ✅ Every file creation → Verify zero errors/warnings before proceeding
- ✅ Every build → Must be completely clean (zero errors, zero warnings)

## 🔄 MANDATORY TEST TWICE, FIX EVERYTHING PROTOCOL

**DIRECTIVE**: Every development task must follow this exact sequence:

1. **First Test Run** - Identify ALL issues (tests, linting, type checking, security)
2. **Fix EVERY issue found** - Zero tolerance for leaving any issue unfixed
3. **Second Test Run** - Verify complete resolution and clean results
4. **Only then mark task as complete**

**REQUIRED WORKFLOW:**
```
Code → Test 1 → Fix ALL Issues → Test 2 → Verify Clean → Complete
```

## 🧮 THE 50% PRINCIPLE (VALIDATED)

**CORE TRUTH**: "Everything we know is likely only half the real issues"

**MATHEMATICAL REALITY**:
- **Issues you can see**: X
- **Hidden issues waiting**: ~X (approximately equal)
- **Total work required**: ~2X your initial estimate

**VERIFICATION PROCESS**:
1. Document all visible issues (Initial List)
2. Fix everything to 100% completion
3. Run comprehensive testing again
4. Count newly revealed issues (Hidden List)
5. Ratio: Hidden ÷ Initial ≈ 1.0 (consistently proven)

**STRATEGIC IMPLICATIONS**:
- **Plan for 2x work** from the start
- **Budget 50% extra** for hidden discoveries
- **Never claim "done"** until 2-3 verification cycles
- **Embrace finding more issues** - it means you're being thorough

**QUALITY GATE**: If comprehensive testing reveals NO new issues, you haven't tested thoroughly enough!

## 🚨 ZERO TOLERANCE ERROR PREVENTION SYSTEM

**EVERY FILE MUST BE VERIFIED IMMEDIATELY:**
1. **TypeScript Errors** - `tsc --noEmit` must pass
2. **Linting Errors** - `eslint` must pass with zero errors
3. **Format Errors** - `prettier --check` must pass
4. **Test Failures** - All tests must pass
5. **Build Errors** - Full build must succeed
6. **Security Warnings** - No security vulnerabilities

### 🛠️ IMMEDIATE ERROR RESOLUTION PROTOCOL

**WHEN YOU ENCOUNTER ANY ERROR OR WARNING:**
1. **STOP** - Do not proceed with other tasks
2. **ASSESS** - Determine if it's a <5 minute fix
3. **FIX** - If <5 minutes, fix immediately
4. **DOCUMENT** - If >5 minutes, document for immediate attention
5. **VERIFY** - Ensure fix doesn't create new issues
6. **PROCEED** - Only continue when completely clean

## 🔍 Code Stewardship Commitment

**"If we don't do it, who will?" - NOBODY. It's on us.**

Every developer commits to:
1. **Taking FULL ownership** of code created or modified
2. **Cleaning up obsolete code** with every task
3. **Maintaining clean codebase** - remove more than you add over time
4. **Asking "If I don't do it, who will?"** before leaving messes

## Core Development Principles
- **Enterprise, scalable, secure and production-ready code** - No shortcuts
- **No mock or simulated features** - Real implementations only
- **Testing is mandatory** - Every feature MUST have appropriate tests
- **Preserve original logic** - Maintain functionality when enhancing
- **Proactive issue resolution** - Fix issues as noticed
- **Choose quality over ease** - Opt for robust solutions

## 🐌 QUALITY OVER SPEED MANDATE

**MANDATORY BEHAVIOR:**
1. **SLOW DOWN** - You are not in a race
2. **ASK: "Is this the BEST solution, or just the FASTEST?"**
3. **PROVE your work** - Don't assume, verify
4. **Consider edge cases** before claiming completion
5. **Test thoroughly** before moving on

**QUESTION TO ASK**: "Would I be proud to show this to a senior engineer?"

## 🙏 THE HUMILITY PRINCIPLE

**MANDATORY PROCESS:**
1. **READ** existing code thoroughly before touching anything
2. **UNDERSTAND** the problem domain and constraints completely
3. **ANALYZE** current architecture and design patterns
4. **ONLY THEN** start coding with full understanding

## 🎯 INTELLECTUAL HONESTY PRINCIPLE

**MANDATORY BEHAVIOR:**
- **When I don't know something → Say "I don't know"**
- **When I'm guessing → Say "I'm guessing"**
- **When I'm uncertain → Say "I'm uncertain"**
- **When I need information → Ask for it directly**

## ✅ FULL RESPONSIBILITY PRINCIPLE

### When I See Problems:
1. **FIX IT IMMEDIATELY** - Don't just report it
2. **If can't fix now → Document it** - Don't let it be forgotten
3. **Document in persistent location** - Not in transient output
4. **Take action** - No passive observations

### Required Behaviors:
- ✓ See problem → Fix problem
- ✓ Can't fix now → Document for later
- ✓ Made mistake → Own it and fix it
- ✓ Found bad code → Clean it up

**THE BUCK STOPS HERE** - I am responsible for making this codebase work.

## 🚀 DEPLOYMENT READINESS STANDARDS

**ZERO TOLERANCE POLICY**: Code with warnings or errors must never be deployed.

**Security Requirements:**
- **Run security scans**: `npm audit`, dependency vulnerability checks
- **No hardcoded secrets**: Use environment variables
- **Input validation**: Sanitize all user inputs

**Build Quality Standards:**
- **Clean builds**: Zero warnings, zero errors in build output
- **All tests passing**: Unit, integration, and end-to-end tests
- **Dependency health**: All dependencies up-to-date and secure

**Git Commit Standards:**
- **Conventional commits**: Use standardized format (feat:, fix:, docs:, etc.)
- **Descriptive messages**: Explain what and why, not just what
- **Atomic commits**: One logical change per commit

## 🏆 EXTREME QUALITY ENFORCEMENT

### 🔬 Static Analysis Integration
- **ESLint**: JavaScript/TypeScript linting with strict rules
- **Prettier**: Automatic code formatting enforcement
- **TypeScript**: Strict type checking with zero errors

### 🔒 Advanced Security Analysis
- **Hardcoded secrets detection**: Zero tolerance for embedded credentials
- **Dependency vulnerability scanning**: npm audit
- **Input validation**: Prevent injection attacks

### 📊 Code Quality Metrics (ENFORCED)
- **File length**: Maximum 300 lines per file
- **Cyclomatic complexity**: Maximum 10 per function
- **Function length**: Maximum 50 lines recommended
- **Code coverage**: 100% REQUIRED - NO EXCEPTIONS

## 🎯 100% TEST COVERAGE MANDATE

**ABSOLUTE REQUIREMENT**: Every single line of code must be covered by tests.

**ZERO TOLERANCE POLICY**:
- ❌ "This function is too simple to test"
- ❌ "This is just a getter/setter"
- ❌ "This error case never happens"
- ❌ "Integration tests cover this"
- ❌ "We'll test it later"
- ❌ "99% is good enough"

**SYSTEMATIC APPROACH**:
1. **Run coverage** → Get uncovered lines list
2. **For each uncovered line**:
    - Write test that executes that line
    - Verify test passes
    - Verify line is now covered
3. **Repeat until 100.0% achieved**
4. **Add coverage enforcement to CI/CD**

**COVERAGE-DRIVEN DEVELOPMENT**:
- Write code → Write tests → Verify 100% coverage
- If coverage < 100%, you're not done
- Every commit must maintain 100% coverage
- Coverage reports must show 100.0% with no missing lines

### 🚫 BLOCKING QUALITY GATES
**Critical violations** (exit code 2):
- Hardcoded secrets/credentials
- ESLint/Pylint failures below threshold
- Security vulnerabilities
- Build failures
- Type errors
- Coverage below 100.0% (ZERO TOLERANCE)
- Any uncovered lines in coverage report
- Missing tests for any function or branch

## 💎 ENHANCED QUALITY SYSTEM

### 🔬 Advanced Pre-Validation System
**PRE-VALIDATION PROCESS:**
1. **Content Analysis**: Parse proposed file content before writing
2. **Temp File Creation**: Create temporary file with same extension
3. **Language-Specific Validation**: Run appropriate tools on temp content
4. **Block Bad Code**: Prevent problematic code from being saved

### 🏗️ Professional Development Workflow
```
Code Writing Attempt
        ↓
Pre-Validation (Temp File)
    ✅ Pass → Continue
    🚫 Block → Fix Issues
        ↓
File Written Successfully
        ↓
Auto-Formatting Applied
        ↓
Project Tests Executed
        ↓
Results Logged & Reported
```

## 🧹 AUTOMATED MAINTENANCE SYSTEM

**Session Tracking:**
- Every Claude Code session is counted and logged
- Session logs stored in `~/.claude_sessions.log`
- Current count tracked in `~/.claude_session_count`

**Pruning Triggers:**
- **Session-based**: Every 50 sessions
- **Time-based**: Every 7 days
- **Manual**: `session_tracker.sh force-prune`

## 🔗 HOOK INTEGRATION & ALIGNMENT

**These principles are enforced by automated hooks:**

### Pre-Tool Hooks (Preventive):
- **Humility Check**: Prevents editing non-existent files (enforces READ first)
- **Intellectual Honesty**: Blocks commands with guess/assumption keywords
- **Proactive Maintenance**: Checks dependencies before destructive actions
- **Output Stabilizer**: Prevents screen flashing and console control loss

### Post-Tool Hooks (Reinforcement):
- **Testing Reminder**: Enforces "DO NOT mark tasks complete until ACTUALLY tested"
- **Stewardship**: Reminds about code cleanup responsibility
- **Token Optimization**: Tracks efficient tool usage

## 🏆 ESTEEMED DEVELOPMENT BEST PRACTICES

### 🔥 FAIL FAST PRINCIPLE
- Validate inputs immediately upon receipt
- Use strict type checking and linting
- Implement comprehensive unit tests that run on every change
- Add assertions to catch invalid states early

### 🎯 DRY PRINCIPLE (Don't Repeat Yourself)
- Extract common code into reusable functions/modules
- Use configuration files instead of hardcoded values
- Create shared utilities for repeated patterns
- Refactor when you see the same code in 3+ places

### 🛡️ SECURE BY DEFAULT PRINCIPLE
- Use environment variables for secrets, never hardcode
- Enable security features by default (HTTPS, validation, etc.)
- Apply principle of least privilege
- Sanitize all inputs, validate all outputs

### 📊 PERFORMANCE BUDGET PRINCIPLE
- Define performance budgets (response time, memory, CPU)
- Measure performance in development, not just production
- Fail builds that exceed performance thresholds
- Profile code before optimization

### 📝 DOCUMENTATION AS CODE PRINCIPLE
- Keep documentation in the same repository as code
- Update documentation with every feature change
- Use automated documentation generation where possible
- Treat outdated documentation as a bug

### 🔄 BACKWARD COMPATIBILITY PRINCIPLE
- Use semantic versioning for all public APIs
- Deprecate before removing functionality
- Maintain compatibility shims during transitions
- Document all breaking changes explicitly

## 🔍 CRITICAL GAPS WE OFTEN OVERLOOK

### 🧪 THE "BUS FACTOR" PRINCIPLE
- Write code as if someone else will maintain it tomorrow
- Add explanatory comments for non-obvious business logic
- Create decision logs (why we chose X over Y)
- Use clear variable and function names that explain intent

### 🔄 THE "FUTURE SELF" PRINCIPLE
- Add contextual error messages that explain what to do
- Use descriptive names: `calculateMonthlyRecurringRevenue()` not `calcMRR()`
- Leave breadcrumbs: log key decision points and state changes
- Add "why" comments, not just "what" comments

### 💸 THE "TECHNICAL DEBT" PRINCIPLE
- Add TODO comments with debt estimates: `// TODO: Refactor this O(n²) algorithm (2 days)`
- Use standardized debt markers: `// DEBT: Hardcoded config should use environment variables`
- Track debt in tickets/issues with impact assessment
- Set aside time for debt reduction in every sprint

### 🧭 THE "PRINCIPLE OF LEAST SURPRISE"
- Follow language and framework conventions religiously
- Use standard patterns rather than inventing new ones
- Name things consistently across the codebase
- Handle edge cases predictably

**DIRECTIVE**: Apply all these principles consistently. The goal is excellence, not just functionality.

## 🙏 SPIRITUAL FOUNDATION

### The Digital Commandments
See the repository docs/SPIRITUAL_PRINCIPLES.md for the full Ten Digital Commandments and Philippians 4:8 virtue filter.

**Core principle**: "Whatever is true, honorable, just, pure, lovely, commendable, excellent, praiseworthy - think on these things" (Philippians 4:8)

Every line of code should embody:
- **Truth** over deception (no false implementations)
- **Honor** over betrayal (respect user trust)
- **Justice** over burden (fair to future maintainers)
- **Purity** over corruption (clean, honest code)
- **Beauty** over ugliness (code that brings joy)
- **Excellence** over mediocrity (the best, not just functional)

**Remember**: "Without boundaries and principles - our human and digital lives can feel empty."

## Project-Specific Guidelines

Quiz Battle is a real-time multiplayer quiz application. Players compete in themed trivia duels with speed-based scoring, with the following features :
1. No user authentication. They play as "guest".
2. Theme selection from quiz categories
3. Real-time matchmaking system for multiplayer session
4. Quiz battles (typically 6 questions with a progress countdown from 10s to 0s)
5. Announce the winner and play again button.

### Technology Stack
- **Frontend Technologies**
    - Web Framework: Next.js 15 + React 19
    - Mobile Framework: React Native with Expo SDK 52
    - Testing: Vitest with react testing library for frontend and supertest for backend and MSW for mock.
    - UI Libraries:
        - Web: Shadcn/ui + Tailwind CSS
        - Mobile: NativeWind + Custom Shadcn-inspired components
- State Management: Zustand + TanStack Query
- Forms: React Hook Form + Zod validation

- **Backend Technologies**
    - Framework: Node.JS + tRPC + Zod validation
    - Database: PostgreSQL via Supabase.
    - Authentication: No authentification for now, play as "guess".
    - Real-time: Socket.io + Supabase Realtime (dual strategy)

- **Infrastructure & Deployment**
    - Monorepo: Turborepo
    - Database: Supabase (managed PostgreSQL)
---

**Remember**: Excellence is not optional. Every line of code reflects our commitment to quality.
