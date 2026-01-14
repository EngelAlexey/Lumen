# Contributing to Lumen

Thank you for your interest in contributing to Lumen! This guide will help you get started.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)

### Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Run `npm install`
4. Run `npm run dev`

## 📝 Coding Standards

### TypeScript
- **Avoid `any` types** - Use proper TypeScript types
- Use type definitions from `~/types/` directory
- Enable strict mode compliance

### Vue/Nuxt
- Use Composition API (`<script setup>`)
- Follow Vue 3 style guide
- Use composables for reusable logic
- Keep components focused and small

### Naming Conventions
- **Files**: kebab-case (`use-auth.ts`, `login-form.vue`)
- **Components**: PascalCase (`AppHeader.vue`)
- **Composables**: camelCase with `use` prefix (`useAuth`, `useTransactions`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)

### Code Style
- Use Prettier for formatting (configured in `.prettierrc`)
- Follow ESLint rules (configured in `eslint.config.mjs`)
- No `console.log` in production code (use `console.warn` or `console.error` if needed)
- Add JSDoc comments for complex functions

## 🧪 Testing

### Running Tests
```bash
npm run test          # Run tests in watch mode
npm run test:ui       # Open Vitest UI
npm run test:coverage # Generate coverage report
```

### Writing Tests
- Write tests for all new composables
- Aim for >80% code coverage
- Place tests in `tests/unit/` or `tests/e2e/`
- Follow the naming convention: `*.test.ts` or `*.spec.ts`

## 🔧 Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `dev` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes

### Commit Messages
Follow conventional commits format:
```
feat: add user authentication
fix: resolve transaction calculation bug
docs: update README with setup instructions
test: add unit tests for useAuth composable
refactor: improve type safety in useTransactions
```

### Pull Request Process
1. Create a feature branch from `dev`
2. Make your changes
3. Run tests: `npm run test`
4. Run type check: `npx nuxi typecheck`
5. Ensure ESLint passes
6. Create PR to `dev` branch
7. Wait for review and CI checks

## 🎨 UI/UX Guidelines

- Follow existing design system (colors, spacing, typography)
- Ensure responsive design (mobile-first)
- Use Nuxt UI components when possible
- Test on different screen sizes
- Maintain accessibility standards

## 🔒 Security

- Never commit `.env` files
- Validate all user input on server-side
- Use Supabase RLS policies
- Review security implications of changes
- Report security issues privately

## 📚 Documentation

- Update README for significant changes
- Document complex logic with comments
- Add JSDoc for public APIs
- Update i18n files (`es.json`, `en.json`) for new UI text

## ❓ Questions?

- Check existing issues and PRs
- Review documentation in `docs/`
- Ask in discussions

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.
