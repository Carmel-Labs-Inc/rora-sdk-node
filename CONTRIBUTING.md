# Contributing to Rora SDK for Node.js

We welcome contributions to the Rora Node.js SDK! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/rora-sdk-node.git
   cd rora-sdk-node
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Development Workflow

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Code Style

We use TypeScript with strict type checking. Run linting before committing:

```bash
npm run lint
```

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Build to verify no TypeScript errors
6. Commit with a clear message:
   ```bash
   git commit -m "Add feature: description of change"
   ```

## Pull Request Process

1. Update documentation if needed
2. Submit a pull request with a clear description
3. Wait for review and address any feedback

## Code Guidelines

- Use TypeScript strict mode
- Add JSDoc comments to public functions
- Keep functions focused and small
- Handle errors gracefully with proper types
- Export types from index.ts

## Reporting Issues

- Use GitHub Issues
- Include Node.js version, OS, and SDK version
- Provide a minimal reproducible example
- Include full error stack trace

## Questions?

- Open a GitHub Discussion
- Email: dev@carmel.so

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
