#!/bin/bash

# Top 10 Essential Skills Quick Reference
# Project: Algo Infinity Verse
# Note: Skills are invoked via Claude Code /skill-name command, not installed

cat << 'EOF'
🚀 Top 10 Essential Skills for Algo Infinity Verse
====================================================

Skills are activated via Claude Code Skill tool.
Trigger in conversation: /skill-name [args]

SKILL REFERENCE:
================

1. /conventional-commits
   Purpose: Standardize commit messages
   Usage: /conventional-commits [message]

2. /unit-test-generator
   Purpose: Auto-generate unit tests
   Usage: /unit-test-generator --path src/script.js

3. /auth-security-reviewer
   Purpose: Review auth implementation for vulnerabilities
   Usage: /auth-security-reviewer

4. /accessibility-auditor
   Purpose: WCAG compliance checks
   Usage: /accessibility-auditor --path src/

5. /code-review-excellence
   Purpose: Comprehensive code reviews
   Usage: /code-review-excellence --effort high

6. /core-web-vitals-tuner
   Purpose: Optimize LCP, FID, CLS metrics
   Usage: /core-web-vitals-tuner

7. /github-actions-pipeline-creator
   Purpose: Create CI/CD pipelines
   Usage: /github-actions-pipeline-creator --template node

8. /caching-strategy-optimizer
   Purpose: Optimize localStorage & browser caching
   Usage: /caching-strategy-optimizer

9. /posthog-analytics
   Purpose: User analytics integration
   Usage: /posthog-analytics --setup

10. /api-docs-generator
    Purpose: Auto-generate API documentation
    Usage: /api-docs-generator --output docs/

QUICK COMMANDS:
================

Try these in Claude Code chat:
  /conventional-commits
  /unit-test-generator
  /auth-security-reviewer
  /accessibility-auditor
  /code-review-excellence

See AGENTS.md for full details and additional skills.
EOF
