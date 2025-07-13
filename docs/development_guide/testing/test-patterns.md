# Testing Patterns & Examples

Based on the documentation from React Native Testing Library, MobX State Tree, and Supabase, here are practical testing patterns for our Enhanced Eventify App.

## 🧪 Basic Testing Setup

### Running Tests
```bash
# Run all tests
bun test

# Run tests in watch mode  
bun test --watch

# Run specific test
bun test Button.test.tsx
```

## 📱 React Native Component Testing

### Basic Component Test Pattern
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button text="Click Me" />);
    expect(screen.getByText('Click Me')).toBeOnTheScreen();
  });

  it('should handle press events', () => {
    const mockOnPress = jest.fn();
    render(<Button text="Click Me" onPress={mockOnPress} />);
    
    const button = screen.getByText('Click Me');
    fireEvent.press(button);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

### Testing with Props and State
```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { EventCard } from './EventCard';

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    description: 'Test Description',
    date: new Date('2024-12-01'),
    location: 'Test Location'
  };

  it('should display event information', () => {
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText('Test Event')).toBeOnTheScreen();
    expect(screen.getByText('Test Description')).toBeOnTheScreen();
    expect(screen.getByText('Test Location')).toBeOnTheScreen();
  });

  it('should handle favorite toggle', async () => {
    const mockOnFavorite = jest.fn();
    render(<EventCard event={mockEvent} onFavorite={mockOnFavorite} />);
    
    const favoriteButton = screen.getByRole('button', { name: /favorite/i });
    fireEvent.press(favoriteButton);
    
    await waitFor(() => {
      expect(mockOnFavorite).toHaveBeenCalledWith('1');
    });
  });
});
```

## 🏪 MobX State Tree Testing

### Basic Store Testing
```typescript
import { AuthenticationStoreModel } from './AuthenticationStore';

describe('AuthenticationStore', () => {
  let store: any;

  beforeEach(() => {
    store = AuthenticationStoreModel.create({});
  });

  it('should initialize with no auth token', () => {
    expect(store.authToken).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('should set auth token', () => {
    store.setAuthToken('test-token');
    
    expect(store.authToken).toBe('test-token');
    expect(store.isAuthenticated).toBe(true);
  });

  it('should logout user', () => {
    store.setAuthToken('test-token');
    store.logout();
    
    expect(store.authToken).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });
});
```

### Testing Store Actions with Async Operations
```typescript
import { EventStoreModel } from './EventStore';
import { getSnapshot, applySnapshot } from 'mobx-state-tree';

describe('EventStore', () => {
  let store: any;

  beforeEach(() => {
    store = EventStoreModel.create({
      events: [],
      loading: false,
      error: null
    });
  });

  it('should fetch events successfully', async () => {
    const mockEvents = [
      { id: '1', title: 'Event 1' },
      { id: '2', title: 'Event 2' }
    ];

    // Mock the API call
    jest.spyOn(store, 'fetchEventsFromAPI').mockResolvedValue(mockEvents);

    await store.fetchEvents();

    expect(store.loading).toBe(false);
    expect(store.events).toHaveLength(2);
    expect(store.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Network error');
    jest.spyOn(store, 'fetchEventsFromAPI').mockRejectedValue(mockError);

    await store.fetchEvents();

    expect(store.loading).toBe(false);
    expect(store.events).toHaveLength(0);
    expect(store.error).toBe('Network error');
  });
});
```

### Testing Store Snapshots
```typescript
import { getSnapshot, applySnapshot } from 'mobx-state-tree';

describe('Store Snapshots', () => {
  it('should create and restore from snapshot', () => {
    const store = EventStoreModel.create({
      events: [{ id: '1', title: 'Test Event' }]
    });

    const snapshot = getSnapshot(store);
    expect(snapshot).toEqual({
      events: [{ id: '1', title: 'Test Event' }],
      loading: false,
      error: null
    });

    const newStore = EventStoreModel.create({});
    applySnapshot(newStore, snapshot);
    
    expect(newStore.events).toHaveLength(1);
    expect(newStore.events[0].title).toBe('Test Event');
  });
});
```

## 🗄️ Supabase Testing Patterns

### Mocking Supabase Client
```typescript
// In test setup or individual test files
const mockSupabase = {
  auth: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));
```

### Testing Auth Service
```typescript
import { AuthService } from './AuthService';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should login user successfully', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    mockSupabase.auth.signIn.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    const result = await authService.login('test@example.com', 'password');

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
    expect(mockSupabase.auth.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });

  it('should handle login errors', async () => {
    const mockError = { message: 'Invalid credentials' };
    mockSupabase.auth.signIn.mockResolvedValue({
      data: { user: null },
      error: mockError
    });

    const result = await authService.login('test@example.com', 'wrongpassword');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
});
```

### Testing Database Operations
```typescript
import { EventService } from './EventService';

describe('EventService', () => {
  let eventService: EventService;

  beforeEach(() => {
    eventService = new EventService();
    jest.clearAllMocks();
  });

  it('should fetch events successfully', async () => {
    const mockEvents = [
      { id: '1', title: 'Event 1', date: '2024-12-01' },
      { id: '2', title: 'Event 2', date: '2024-12-02' }
    ];

    mockSupabase.from().select().mockResolvedValue({
      data: mockEvents,
      error: null
    });

    const result = await eventService.getEvents();

    expect(result.data).toEqual(mockEvents);
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('events');
  });

  it('should create event successfully', async () => {
    const newEvent = { title: 'New Event', date: '2024-12-01' };
    const mockCreatedEvent = { id: '123', ...newEvent };

    mockSupabase.from().insert().single.mockResolvedValue({
      data: mockCreatedEvent,
      error: null
    });

    const result = await eventService.createEvent(newEvent);

    expect(result.data).toEqual(mockCreatedEvent);
    expect(mockSupabase.from().insert).toHaveBeenCalledWith(newEvent);
  });
});
```

## 📱 Screen Testing with MST Integration

### Testing Screen with Store
```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { EventListScreen } from './EventListScreen';
import { RootStoreModel } from '@/models';

// Create a mock store for testing
const createMockStore = (overrides = {}) => {
  return RootStoreModel.create({
    eventStore: {
      events: [],
      loading: false,
      error: null,
      ...overrides
    },
    authenticationStore: {
      authToken: 'mock-token',
      authEmail: 'test@example.com'
    }
  });
};

describe('EventListScreen', () => {
  it('should display events from store', async () => {
    const mockStore = createMockStore({
      events: [
        { id: '1', title: 'Event 1', date: '2024-12-01' },
        { id: '2', title: 'Event 2', date: '2024-12-02' }
      ]
    });

    render(<EventListScreen store={mockStore} />);

    expect(screen.getByText('Event 1')).toBeOnTheScreen();
    expect(screen.getByText('Event 2')).toBeOnTheScreen();
  });

  it('should show loading state', () => {
    const mockStore = createMockStore({ loading: true });

    render(<EventListScreen store={mockStore} />);

    expect(screen.getByTestId('loading-spinner')).toBeOnTheScreen();
  });

  it('should handle refresh action', async () => {
    const mockStore = createMockStore();
    const fetchEventsSpy = jest.spyOn(mockStore.eventStore, 'fetchEvents');

    render(<EventListScreen store={mockStore} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(fetchEventsSpy).toHaveBeenCalled();
    });
  });
});
```

## 🔧 Utility Function Testing

### Simple TDD Example
```typescript
// First write the test (RED)
describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
});

// Then implement the function (GREEN)
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Refactor if needed (REFACTOR)
export function validateEmail(email: string): boolean {
  if (!email?.trim()) return false;
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}
```

### Date Formatting Utility
```typescript
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-12-01T10:30:00Z');
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-12-01');
  });

  it('should handle invalid dates', () => {
    expect(formatDate(null, 'YYYY-MM-DD')).toBe('');
    expect(formatDate(undefined, 'YYYY-MM-DD')).toBe('');
  });
});
```

## 🚀 Advanced Testing Patterns

### Testing with User Events
```typescript
import { render, screen, userEvent } from '@testing-library/react-native';

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.press(screen.getByRole('button', { name: 'Login' }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

### Testing Async Operations
```typescript
describe('AsyncComponent', () => {
  it('should handle async data loading', async () => {
    render(<AsyncComponent />);

    // Wait for loading to complete
    expect(await screen.findByText('Data loaded')).toBeOnTheScreen();
    
    // Check that loading spinner is gone
    expect(screen.queryByTestId('loading')).not.toBeOnTheScreen();
  });
});
```

### Integration Testing Example
```typescript
describe('Authentication Flow', () => {
  it('should complete full login flow', async () => {
    const store = createRealStore(); // Use real store with mocked API
    const user = userEvent.setup();

    render(<App store={store} />);

    // Navigate to login
    await user.press(screen.getByText('Login'));

    // Fill login form
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.press(screen.getByRole('button', { name: 'Sign In' }));

    // Verify redirect to main app
    expect(await screen.findByText('Welcome')).toBeOnTheScreen();
    expect(store.authenticationStore.isAuthenticated).toBe(true);
  });
});
```

## 📊 Test Coverage and Quality

### Good Test Characteristics
- **Independent**: Tests don't depend on each other
- **Repeatable**: Same result every time
- **Fast**: Quick feedback loop
- **Clear**: Easy to understand what's being tested
- **Realistic**: Test real user scenarios

### Test Organization
```
app/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   └── EventCard/
│       ├── EventCard.tsx
│       └── EventCard.test.tsx
├── models/
│   ├── AuthenticationStore.ts
│   ├── AuthenticationStore.test.ts
│   ├── EventStore.ts
│   └── EventStore.test.ts
└── utils/
    ├── validateEmail.ts
    ├── validateEmail.test.ts
    ├── formatDate.ts
    └── formatDate.test.ts
```

## 🎯 TDD Best Practices Summary

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code while tests stay green
4. **Test behavior, not implementation**
5. **Use descriptive test names**
6. **Keep tests simple and focused**
7. **Mock external dependencies**
8. **Test edge cases and error scenarios**

---

These patterns provide a solid foundation for implementing TDD in our Enhanced Eventify App with React Native, MobX State Tree, and Supabase.