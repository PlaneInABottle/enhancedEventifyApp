# Ignite CLI Documentation Reference

This file contains comprehensive documentation for Ignite CLI commands and patterns, saved for AI session reference.

## Core Generator Commands

### Screen Generation
```bash
npx ignite-cli generate screen Settings
# Creates a new React Native screen with MobX-State-Tree observer wrapper
```

### Component Generation
```bash
npx ignite-cli generate component MyAwesomeButton
# Creates a new React component with MobX-State-Tree observer
```

### Model Generation
```bash
npx ignite-cli generate model Pizza
# Scaffolds a new MobX-State-Tree model with unit test
# Automatically exports from models/index.ts unless --skip-index-file is used
```

### Navigator Generation
```bash
npx ignite-cli generate navigator OrderPizza
# Creates a new React Navigation navigator in app/navigators
```

## Generator Options

### List Available Generators
```bash
npx ignite-cli generate --list
# Shows all built-in and custom generators
```

### Filename Casing Control
```bash
npx ignite-cli generate screen log-in --case pascal  # LogInScreen.tsx
npx ignite-cli generate screen log-in --case camel   # logInScreen.tsx
npx ignite-cli generate screen log-in --case snake   # log_in_screen.tsx
npx ignite-cli generate screen log-in --case kebab   # log-in-screen.tsx
```

### Custom Output Directory
```bash
npx ignite-cli generate screen Settings --dir src/screens
# Overrides default app/ directory
```

## Project Creation

### New Project with Interactive Setup
```bash
npx ignite-cli@latest new PizzaApp
# Interactive prompts for configuration
```

### New Project with Defaults
```bash
npx ignite-cli@latest new PizzaApp --yes
# Accept all recommended defaults, skip prompts
```

### Debug Mode
```bash
npx ignite-cli@latest new PizzaApp --debug
# Verbose output for troubleshooting
```

## Advanced Generators

### App Icons
```bash
npx ignite-cli generate app-icon ios
# Generates iOS app icons from ignite/templates/app-icon folder

npx ignite-cli generate app-icon --update
npx ignite-cli generate app-icon --skip-source-equality-validation
# Reset to default icons and regenerate
```

### Splash Screens
```bash
npx ignite-cli generate splash-screen FF0000
npx ignite-cli generate splash-screen "#FF0000"
npx ignite-cli generate splash-screen fff

# With custom sizes
npx ignite-cli generate splash-screen FF0000 --ios-size=150 --android-size=180
```

## Development Commands

### Help and Information
```bash
npx ignite-cli help                    # Show all commands
npx ignite-cli doctor                  # Check environment setup
npx ignite-cli --info                  # CLI version info
```

### Cache Management
```bash
npx ignite-cli cache                   # General cache interaction
npx ignite-cli cache path              # Show cache location
npx ignite-cli cache clear             # Clear dependency cache
```

### Demo Code Management
```bash
npx ignite-cli remove-demo             # Remove all demo code
npx ignite-cli remove-demo --dry-run   # Preview what would be removed
npx ignite-cli remove-demo-markup      # Remove demo comments only
```

### Template Updates
```bash
npx ignite-cli update                  # Update generator templates
npx ignite-cli update --all            # Update all template types
```

## Common Patterns from Demo Code

### Screen Component Structure
- All screens use `Screen` component wrapper
- MobX-State-Tree `observer` wrapper for reactivity
- TypeScript with proper prop types
- Theming with `useAppTheme` hook
- Safe area handling with `useSafeAreaInsetsStyle`

### Navigator Patterns
- Bottom tab navigators with proper TypeScript types
- Screen options for tab icons and labels
- Themed styling consistent across navigators
- Safe area insets for proper spacing

### Component Best Practices
- Functional components with TypeScript
- MobX observer for state reactivity
- Themed styles using `ThemedStyle` type
- Proper prop interfaces extending screen props

## File Structure Created by Generators

### Screen Generation
```
app/screens/
  SettingsScreen.tsx        # Main screen component
```

### Component Generation
```
app/components/
  MyAwesomeButton.tsx       # Component file
```

### Model Generation
```
app/models/
  Pizza.ts                  # MST model
  Pizza.test.ts            # Unit test
  index.ts                 # Updated with export (unless --skip-index-file)
```

### Navigator Generation
```
app/navigators/
  OrderPizzaNavigator.tsx   # Navigator component
```

## Template Customization

### EJS Template Syntax
```ejs
---
filename: <%= props.camelCaseName %>.tsx
destinationDir: app/navigation
---

type <%= props.pascalCaseName %>Props = { some: string }
export function <%= props.pascalCaseName %>(props: <%= props.pascalCaseName %>Props) {
  return <Text>{props.some} in a <%= props.pascalCaseName %> component!</Text>
}
```

### Available Props in Templates
- `props.skipIndexFile` - boolean, true if --skip-index-file passed
- `props.filename` - string, generated filename
- `props.pascalCaseName` - PascalCase version of name
- `props.camelCaseName` - camelCase version
- `props.kebabCaseName` - kebab-case version
- `props.subdirectory` - subdirectory path

## Troubleshooting

### Global Installation Conflicts
```bash
npm uninstall -g ignite-cli           # Remove global version
npx ignite-cli                        # Use npx for latest version
```

### Xcode Issues (macOS)
```bash
sudo xcode-select --install           # Install command line tools
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### Report Issues
```bash
npx ignite-cli issue "Unable to Ignite new app"
# Opens pre-filled GitHub issue with diagnostic info
```

## Testing Local Changes
```bash
# For testing local Ignite CLI modifications
node your-ignite-repo-clone/bin/ignite new PizzaApp
node your-ignite-repo-clone/bin/ignite generate component OrderButton
```

---

*This documentation is saved for AI session reference to ensure consistent use of Ignite CLI patterns and best practices across development sessions.*