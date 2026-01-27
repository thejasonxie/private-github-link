# Private GitHub Link

Share private GitHub repositories without adding collaborators. Generate shareable links that give read-only access to your private repos.

**Live Demo:** [https://privategithub.link](https://privategithub.link) 
- navigates to `https://share-github.com/{owner}/{repo}` for repo - see pro tip

## Features

- **Instant Sharing** - Generate a shareable link in seconds
- **No Collaborator Access** - Share code without granting write access
- **Syntax Highlighting** - Beautiful code viewing for 100+ languages
- **Full Navigation** - Browse directories, view files, switch branches
- **Branch Access** - Share specific branches
- **Dark/Light Mode** - Automatic theme detection with manual toggle

## Why?

People have been asking GitHub for this feature for years ([#23128](https://github.com/orgs/community/discussions/23128), [#44506](https://github.com/orgs/community/discussions/44506)). The ability to share read-only access to a private repository—without adding collaborators—remains highly requested but unimplemented.

Common use cases:

- Share code with clients for review
- Let contractors browse a codebase before starting work
- Show code during technical interviews
- Link to private code from internal documentation

This tool fills that gap with a simple shareable URL - no GitHub invitations required.

**Pro Tip:** Prepend `share-` to any GitHub URL to instantly open it in the app:
```
github.com/owner/repo → share-github.com/owner/repo
```

## Self-Hosting

Don't want to trust a third party with your access token? Self-host your own instance.

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)

### Local Development

```bash
# Clone the repository
git clone https://github.com/thejasonxie/private-github-link.git
cd private-github-link

# Install dependencies
bun install

# Start development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

No environment variables are required for basic functionality. The app uses client-side GitHub API calls with user-provided tokens.

Optional variables for production:

```bash
# Sentry error tracking (optional)
VITE_SENTRY_DSN=your_sentry_dsn

# PostHog analytics (optional)
VITE_POSTHOG_KEY=your_posthog_key
```

### Production Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## How It Works

1. User enters a GitHub repository URL and personal access token
2. The app generates a shareable URL with the token embedded
3. Recipients can browse the repo using the GitHub API
4. All API calls happen client-side - no server stores your token

**Security Note:** The access token is embedded in the URL. Only share links with people you trust. Use fine-grained tokens with minimal permissions (read-only access to specific repos).

## Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run preview      # Preview production build
bun run test         # Run tests
bun run test:watch   # Run tests in watch mode
bun run test:coverage # Run tests with coverage
bun run lint         # Lint code
bun run format       # Format code
bun run check        # Lint + format check
```

## Testing

This project uses [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/) and [MSW](https://mswjs.io/) for API mocking.

```bash
# Run all tests
bun run test

# Run with coverage
bun run test:coverage

# Run specific test file
bun run test -- src/lib/utils.test.ts
```

See [TESTING.md](./TESTING.md) for more details on the testing setup.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Author

Created by [@thejasonxie](https://github.com/thejasonxie)
