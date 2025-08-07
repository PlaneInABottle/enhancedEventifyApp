# Essential Commands - Enhanced Eventify App

## Development
```bash
bun start               # Start dev server (expo start --dev-client)
bun run ios             # Run on iOS simulator
bun run android         # Run on Android emulator  
bun run web             # Run on web browser
```

## Quality Checks (Run before committing)
```bash
bun run compile         # TypeScript check (tsc --noEmit)
bun run lint            # ESLint check with auto-fix
bun run lint:check      # ESLint check without fixing
bun test                # Run all tests
bun run test:watch      # Watch mode for TDD
```

## Build Commands
```bash
bun run bundle:web      # Export web build
bun run serve:web       # Serve web build locally
bun run prebuild:clean  # Clean prebuild

# EAS Build Commands (Local builds)
bun run build:ios:sim      # iOS simulator build
bun run build:android:dev  # Android device development
bun run build:ios:prod     # iOS production build
bun run build:android:prod # Android production build
```

## Testing
```bash
bun test                    # Run Jest tests
bun run test:watch          # Watch mode for development
bun run test:maestro        # Run E2E tests with Maestro
```

## Development Setup
```bash
bun run adb                 # Setup ADB port forwarding for Android
bun run align-deps          # Fix Expo dependencies
```

## System Commands (Linux)
- `grep -r "pattern" app/` - Search in codebase
- `find app/ -name "*.tsx"` - Find React components
- `git status` - Check git status  
- `ls -la` - List files with details