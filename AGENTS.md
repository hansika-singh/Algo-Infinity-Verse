# Agent Skills Setup

**Project:** Algo Infinity Verse - Interactive DSA Learning Platform
**Tech Stack:** Vanilla JS, Node.js, HTML5/CSS3, Firebase Admin, localStorage
**Branch:** feat/agent-skills-setup

---

## 📋 Overview

Claude Code skills extend agent capabilities for specific tasks. Install skills to automate code generation, reviews, testing, and optimization.

---

## ✅ Installed Skills

| # | Skill | Category | Use Case |
|---|-------|----------|----------|
| 1 | **GitHub Actions Docs** | DevOps | CI/CD workflows, GitHub Actions setup, deployment automation |
| 2 | **Conventional Commit** | Git | Standardized commit messages, clean git history, changelog automation |
| 3 | **WCAG Audit Patterns** | Accessibility | Find a11y issues, WCAG 2.2 compliance, audit websites |
| 4 | **Accessibility Compliance** | Accessibility | Build accessible interfaces, screen reader support, ARIA patterns |
| 5 | **Core Web Vitals** | Performance | Optimize LCP/CLS/INP, improve page speed, better user experience |
| 6 | **Deploy to Vercel** | Deployment | Ship code to production, preview deployments, manage environments |
| 7 | **Code Review Excellence** | Code Quality | Review PRs effectively, improve code quality, mentor developers |
| 8 | **API Docs Generator** | Documentation | Create API docs, OpenAPI specs, interactive documentation |
| 9 | **Tech Debt Prioritizer** | Code Quality | Identify technical debt, prioritize refactoring, ROI analysis |
| 10 | **Modern JavaScript Patterns** | JavaScript | ES6+ features, async/await, clean functional code |
| 11 | **JavaScript Pro** | JavaScript | Production-grade JS, optimize performance, Node.js development |

---

## 🎯 Recommended Skills by Category

### 🏗️ **Architecture & Design**
- **architecture-patterns** - Design scalable system architecture
- **system-design-generator** - Generate system design docs
- **microservices-patterns** - Multi-service patterns
- **adr-writer** - Architecture Decision Records

### 🎨 **Frontend & UX**
- **responsive-design** - Mobile-first design patterns
- **dark-mode-implementer** - Theme switching (already have this, could enhance)
- **animation-micro-interaction-pack** - Smooth animations & transitions
- **tailwind-design-system** - Design system styling (if migrating from plain CSS)
- **storybook-setup** - Component documentation
- **accessibility-auditor** - WCAG compliance checks
- **wcag-audit-patterns** - a11y testing patterns

### 🔐 **Security & Auth**
- **auth-security-reviewer** - Review auth implementation
- **auth-implementation-patterns** - Best practices for auth flows
- **gdpr-data-handling** - User data compliance
- **pii-redaction-logging-policy-builder** - Secure logging
- **rate-limiting-abuse-protection** - API protection

### 🧪 **Testing & Quality**
- **unit-test-generator** - Auto-generate unit tests
- **integration-test-builder** - Integration test patterns
- **e2e-test-builder** - End-to-end test patterns
- **snapshot-test-refactorer** - Refactor snapshot tests
- **flaky-test-detective** - Diagnose intermittent failures
- **test-data-factory-builder** - Test data generation

### ⚡ **Performance & Optimization**
- **core-web-vitals-tuner** - LCP, FID, CLS optimization
- **sql-optimization-patterns** - Query optimization (for future DB)
- **caching-strategy-optimizer** - localStorage/browser caching
- **load-test-builder** - Load testing scenarios

### 📚 **Documentation & Clarity**
- **readme-generator** - Auto-generate READMEs
- **api-docs-generator** - API documentation
- **jsdoc-typescript-docs** - JSDoc to TypeDoc conversion
- **changelog-automation** - Automated CHANGELOG.md

### 🚀 **DevOps & Deployment**
- **github-actions-pipeline-creator** - CI/CD pipeline setup
- **github-actions-templates** - GitHub Actions templates
- **docker-optimizer** - Container optimization
- **deployment-checklist-generator** - Pre-deploy verification

### 🤖 **AI & Chatbot**
- **langchain-workflow-builder** - LLM integration patterns (for chatbot enhancement)
- **prompt-engineering-patterns** - Prompt optimization
- **rag-implementation** - Retrieval-Augmented Generation (DSA knowledge base)

### 🔍 **Code Quality & Analysis**
- **code-review-excellence** - Comprehensive code reviews
- **codebase-summarizer** - Generate codebase overviews
- **tech-debt-prioritizer** - Identify and prioritize debt
- **dependency-upgrade** - Safe dependency updates
- **conventional-commits** - Commit message standardization

### 📊 **Analytics & Monitoring**
- **posthog-analytics** - Analytics integration (user behavior tracking)
- **observability-setup** - Logging and monitoring
- **grafana-dashboards** - Performance dashboards

### 🧩 **Specific Domain**
- **data-quality-frameworks** - Quiz/problem data validation
- **evaluation-harness** - Test DSA solutions
- **prompt-regression-tester** - Test chatbot consistency

---

## 🚀 Installation Examples

### Install Single Skill
```bash
claude-code install skill <skill-name>
```

### Install Multiple Skills
```bash
claude-code install skill auth-security-reviewer unit-test-generator responsive-design
```

### List Installed Skills
```bash
claude-code list skills
```

### View Skill Details
```bash
claude-code show skill <skill-name>
```

---

## 💡 Quick Setup Suggestions

### Phase 1: Foundation (Start here)
1. **conventional-commits** - Standardize commit messages
2. **architecture-patterns** - Plan structure
3. **unit-test-generator** - Add test coverage

### Phase 2: Security & Compliance
4. **auth-security-reviewer** - Audit auth implementation
5. **gdpr-data-handling** - Ensure data compliance
6. **accessibility-auditor** - WCAG checks

### Phase 3: Performance & Quality
7. **core-web-vitals-tuner** - Optimize frontend
8. **code-review-excellence** - Improve code quality
9. **caching-strategy-optimizer** - Optimize localStorage usage

### Phase 4: DevOps & Analytics
10. **github-actions-pipeline-creator** - Set up CI/CD
11. **posthog-analytics** - User analytics
12. **observability-setup** - Logging & monitoring

---

## 📝 Usage Pattern

```bash
# Trigger skill in workflow
/skill-name [args]

# Example: Generate tests
/unit-test-generator --path src/script.js

# Example: Review auth code
/auth-security-reviewer

# Example: Setup CI/CD
/github-actions-pipeline-creator --template node
```

---

## ✅ Next Steps

1. Identify top 3-5 priority skills for your workflow
2. Install via CLI: `claude-code install skill <name>`
3. Reference skill docs via `/skill-name help`
4. Integrate into PR/development workflow

---

**Last Updated:** 2026-06-14
