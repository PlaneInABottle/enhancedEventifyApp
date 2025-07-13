# Playwright Testing Guide for Enhanced Eventify

This file contains comprehensive Playwright testing patterns and commands for Enhanced Eventify app testing, saved for AI session reference.

## Test Setup and Configuration

### Starting the Test Session
```bash
# Ensure the development server is running
npm start
# Server typically runs on http://localhost:8081 for web
```

### Basic Navigation Commands
```javascript
// Navigate to the app
await page.goto('http://localhost:8081');

// Take screenshot for debugging
await page.screenshot({ path: 'test-screenshot.png' });

// Get accessibility snapshot
await page.getByRole('button').click();
```

## Authentication Flow Testing

### Login Screen Verification
```javascript
// Verify login screen loads
await page.goto('http://localhost:8081');
// Expected: Login form with pre-filled credentials
// - Email: ignite@infinite.red  
// - Password: ign1teIsAwes0m3

// Test login functionality
await page.getByTestId('login-button').click();
// Expected: Navigation to /welcome
```

### Welcome Screen Testing
```javascript
// Verify welcome screen elements
// Expected URL: http://localhost:8081/welcome
// Expected elements:
// - "Your app, almost ready for launch!" heading
// - "Let's go!" button
// - "Log Out" button in header

// Navigate to main app
await page.getByTestId('next-screen-button').click();
// Expected: Navigation to /EnhancedEventify/Map
```

## Main App Navigation Testing

### Bottom Tab Navigation
```javascript
// Test Map tab (default)
// Expected URL: http://localhost:8081/EnhancedEventify/Map
// Expected: Map tab selected, "map" content displayed

// Test Profile tab navigation
await page.getByRole('tab', { name: 'Profile' }).click();
// Expected URL: http://localhost:8081/EnhancedEventify/Profile
// Expected: Profile tab selected
```

### Tab Navigation Verification
```javascript
// Verify tab structure
const tabs = await page.getByRole('tablist');
const mapTab = await page.getByRole('tab', { name: 'Map' });
const profileTab = await page.getByRole('tab', { name: 'Profile' });

// Test tab switching
await mapTab.click();
// Expected: Map content, URL ends with /Map

await profileTab.click(); 
// Expected: Profile content, URL ends with /Profile
```

## Profile Screen Testing

### Profile Screen Elements Verification
```javascript
// Navigate to Profile tab first
await page.getByRole('tab', { name: 'Profile' }).click();

// Verify profile header
// Expected elements:
// - "John Doe" user name
// - "john.doe@example.com" email
// - Profile avatar image

// Verify Settings section
// Expected menu items:
// - "Edit Profile" (clickable)
// - "App Settings" (clickable) 
// - "Theme: light" (clickable, shows current theme)
// - "Notifications" (clickable)

// Verify Account section  
// Expected menu items:
// - "Privacy Settings" (clickable)
// - "Help & Support" (clickable)

// Verify logout functionality
// Expected: "Logout" button at bottom
```

### Profile Navigation Testing
```javascript
// Test Edit Profile navigation
await page.getByText('Edit Profile').click();
// Expected URL: http://localhost:8081/EditProfile
// Expected: Edit Profile form screen

// Test App Settings navigation  
await page.getByText('App Settings').click();
// Expected URL: http://localhost:8081/Settings
// Expected: Settings screen with toggles

// Test Notifications navigation
await page.getByText('Notifications').click(); 
// Expected URL: http://localhost:8081/Notifications
// Expected: Notifications screen
```

## Edit Profile Screen Testing

### Form Elements Verification
```javascript
// Navigate to Edit Profile screen
await page.getByText('Edit Profile').click();

// Verify header
// Expected: "Edit Profile" title with back button

// Verify form fields with pre-filled data:
const nameField = await page.getByRole('textbox', { name: /full name/i });
const emailField = await page.getByRole('textbox', { name: /email/i });
const phoneField = await page.getByRole('textbox', { name: /phone/i });
const bioField = await page.getByRole('textbox', { name: /bio/i });

// Expected values:
// - Full Name: "John Doe"
// - Email: "john.doe@example.com"  
// - Phone: "+1 (555) 123-4567"
// - Bio: "Event enthusiast and community organizer"

// Verify action buttons
// Expected: "Change Photo" button
// Expected: "Save Changes" button
```

### Form Interaction Testing
```javascript
// Test form field editing
await nameField.clear();
await nameField.fill('Jane Smith');

await emailField.clear(); 
await emailField.fill('jane.smith@example.com');

// Test save functionality
await page.getByText('Save Changes').click();
// Expected: Navigation back to Profile screen
// Expected: Console log with saved data
```

## Settings Screen Testing

### Settings Elements Verification
```javascript
// Navigate to Settings screen
await page.getByText('App Settings').click();

// Expected URL: http://localhost:8081/Settings
// Expected: "App Settings" header with back button

// Verify settings sections:
// Appearance Section:
// - "Theme: Light" or "Theme: Dark" (clickable)

// Notifications Section:
// - "Push Notifications" with toggle switch
// - "Email Notifications" with toggle switch  

// Privacy Section:
// - "Location Services" with toggle switch

// Data & Storage Section:
// - "Offline Mode" with toggle switch
// - "Clear Cache" (clickable)

// Support Section:
// - "Help & FAQ" (clickable)
// - "Contact Support" (clickable)
// - "Privacy Policy" (clickable)
```

### Settings Interaction Testing
```javascript
// Test theme toggle
await page.getByText(/Theme:/).click();
// Expected: Theme changes, button text updates

// Test switch toggles
const pushNotificationsSwitch = await page.getByRole('switch', { name: /push notifications/i });
await pushNotificationsSwitch.click();
// Expected: Switch state changes

// Test navigation items
await page.getByText('Help & FAQ').click();
// Expected: Console log or navigation (depending on implementation)
```

## Accessibility Testing

### Screen Reader Testing
```javascript
// Verify proper heading structure
const headings = await page.getByRole('heading');
// Expected: Logical heading hierarchy

// Verify button accessibility
const buttons = await page.getByRole('button');
// Expected: All buttons have accessible names

// Verify form accessibility  
const textboxes = await page.getByRole('textbox');
// Expected: All inputs have proper labels

// Verify tab accessibility
const tabs = await page.getByRole('tab');
// Expected: Proper tab navigation and states
```

### Keyboard Navigation Testing
```javascript
// Test tab navigation
await page.keyboard.press('Tab');
// Expected: Focus moves to next interactive element

// Test enter key on buttons
await page.getByText('Save Changes').focus();
await page.keyboard.press('Enter');
// Expected: Button action triggers

// Test escape key behavior
await page.keyboard.press('Escape');
// Expected: Appropriate escape behavior (close modals, etc.)
```

## Console and Network Testing

### Console Message Monitoring
```javascript
// Get console messages
const messages = await page.evaluate(() => console.messages);

// Check for errors
const errors = messages.filter(msg => msg.type === 'error');
// Expected: No critical errors

// Check for warnings
const warnings = messages.filter(msg => msg.type === 'warning');
// Expected: Only known acceptable warnings (like deprecated props)
```

### Network Request Testing
```javascript
// Monitor network requests
page.on('request', request => {
  console.log('Request:', request.url());
});

page.on('response', response => {
  console.log('Response:', response.status(), response.url());
});

// Test API calls (when implemented)
// Expected: Proper request/response cycles
// Expected: No failed requests (unless expected)
```

## Responsive Design Testing

### Mobile Viewport Testing
```javascript
// Set mobile viewport
await page.setViewportSize({ width: 375, height: 667 });

// Test navigation
await page.getByRole('tab', { name: 'Profile' }).click();
// Expected: Responsive layout on mobile

// Test form inputs on mobile
await page.getByText('Edit Profile').click();
// Expected: Mobile-friendly form layout
```

### Tablet Viewport Testing
```javascript
// Set tablet viewport  
await page.setViewportSize({ width: 768, height: 1024 });

// Test all major screens
// Expected: Appropriate tablet layout
```

## Error Handling Testing

### Navigation Error Testing
```javascript
// Test invalid URLs
await page.goto('http://localhost:8081/invalid-route');
// Expected: Appropriate error handling or redirect

// Test back navigation
await page.goBack();
// Expected: Proper navigation history
```

### Form Validation Testing
```javascript
// Test empty form submission
await page.getByRole('textbox', { name: /email/i }).clear();
await page.getByText('Save Changes').click();
// Expected: Proper validation messages (when implemented)

// Test invalid email format
await page.getByRole('textbox', { name: /email/i }).fill('invalid-email');
await page.getByText('Save Changes').click();
// Expected: Email validation error (when implemented)
```

## Performance Testing

### Page Load Testing
```javascript
// Measure page load time
const start = Date.now();
await page.goto('http://localhost:8081');
const loadTime = Date.now() - start;
// Expected: Reasonable load time (< 3 seconds)

// Test navigation performance
const navStart = Date.now();
await page.getByRole('tab', { name: 'Profile' }).click();
const navTime = Date.now() - navStart;
// Expected: Fast navigation (< 1 second)
```

## Theme Testing

### Light/Dark Theme Testing
```javascript
// Test theme switching
await page.getByRole('tab', { name: 'Profile' }).click();
await page.getByText(/Theme:/).click();

// Verify theme change
// Expected: Visual theme changes throughout app
// Expected: Theme state persists across navigation

// Test theme in different screens
await page.getByText('Edit Profile').click();
// Expected: Consistent theme across all screens
```

## Logout Testing

### Authentication Flow Testing
```javascript
// Test logout functionality
await page.getByRole('tab', { name: 'Profile' }).click();
await page.getByText('Logout').click();

// Expected: Navigation back to login screen
// Expected URL: http://localhost:8081/ (login)
// Expected: Authentication state cleared
```

## Test Automation Patterns

### Common Test Setup
```javascript
// Standard test setup
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:8081');
  // Login if needed
  await page.getByTestId('login-button').click();
  await page.getByTestId('next-screen-button').click();
});
```

### Reusable Navigation Functions
```javascript
// Navigate to Profile
async function navigateToProfile(page) {
  await page.getByRole('tab', { name: 'Profile' }).click();
}

// Navigate to Edit Profile  
async function navigateToEditProfile(page) {
  await navigateToProfile(page);
  await page.getByText('Edit Profile').click();
}

// Navigate to Settings
async function navigateToSettings(page) {
  await navigateToProfile(page);
  await page.getByText('App Settings').click();
}
```

## Troubleshooting Common Issues

### WebSocket Connection Errors
```
Error: WebSocket connection to 'ws://localhost:9090/' failed
Solution: This is expected in web testing, Metro bundler WebSocket for hot reload
```

### Deprecated Props Warnings
```
Warning: Image: style.resizeMode is deprecated
Warning: props.pointerEvents is deprecated  
Solution: These are known React Native Web compatibility warnings
```

### Form Validation Issues
```
Warning: Password field is not contained in a form
Solution: Expected behavior for React Native web forms
```

## Expected App Structure

### Navigation Hierarchy
```
Enhanced Eventify App
├── Login Screen (/)
├── Welcome Screen (/welcome)  
└── Main App (/EnhancedEventify)
    ├── Map Tab (/EnhancedEventify/Map)
    └── Profile Tab (/EnhancedEventify/Profile)
        ├── Edit Profile (/EditProfile)
        ├── Settings (/Settings)
        └── Notifications (/Notifications)
```

### Component Verification Checklist
- [ ] Login screen loads with pre-filled credentials
- [ ] Welcome screen shows app branding and navigation
- [ ] Bottom tab navigation works (Map/Profile)
- [ ] Profile screen shows user info and menu options
- [ ] Edit Profile form has all required fields with data
- [ ] Settings screen has toggles and options
- [ ] Theme switching works across all screens
- [ ] Logout returns to login screen
- [ ] All navigation preserves app state properly
- [ ] No critical console errors
- [ ] Responsive design works on different viewports

---

*This documentation provides comprehensive testing patterns for Enhanced Eventify app using Playwright, ensuring consistent testing across AI development sessions.*