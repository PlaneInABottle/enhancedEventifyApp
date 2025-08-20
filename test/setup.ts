// we always make sure 'react-native' gets included first
// eslint-disable-next-line no-restricted-imports
import * as ReactNative from "react-native"

import mockFile from "./mockFile" // eslint-disable-line @typescript-eslint/no-unused-vars

// Add jest-native matchers
import "@testing-library/jest-native/extend-expect"

// libraries to mock
jest.doMock("react-native", () => {
  // Extend ReactNative
  return Object.setPrototypeOf(
    {
      Image: {
        ...ReactNative.Image,
        resolveAssetSource: jest.fn((_source) => mockFile), // eslint-disable-line @typescript-eslint/no-unused-vars
        getSize: jest.fn(
          (
            uri: string, // eslint-disable-line @typescript-eslint/no-unused-vars
            success: (width: number, height: number) => void,
            failure?: (_error: any) => void, // eslint-disable-line @typescript-eslint/no-unused-vars
          ) => success(100, 100),
        ),
      },
    },
    ReactNative,
  )
})

jest.mock("i18next", () => ({
  currentLocale: "en",
  t: (key: string, params: Record<string, string>) => {
    return `${key} ${JSON.stringify(params)}`
  },
  translate: (key: string, params: Record<string, string>) => {
    return `${key} ${JSON.stringify(params)}`
  },
}))

jest.mock("expo-localization", () => ({
  ...jest.requireActual("expo-localization"),
  getLocales: () => [{ languageTag: "en-US", textDirection: "ltr" }],
}))

// Create a shared translation mock that can be overridden by tests
const mockTranslateFunction = jest.fn((key: string, params?: Record<string, string>) => {
  return params ? `${key} ${JSON.stringify(params)}` : key
})

jest.mock("../app/i18n/index.ts", () => ({
  i18n: {
    isInitialized: true,
    language: "en",
    t: mockTranslateFunction,
    numberToCurrency: jest.fn(),
  },
}))

jest.mock("../app/i18n/translate.ts", () => ({
  translate: mockTranslateFunction,
}))

// Export for use in setupComponentTest
global.mockTranslateFunction = mockTranslateFunction

declare const tron

// Centralized Supabase mock implementation
const createSupabaseQueryChain = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
})

const createSupabaseClientMock = () => ({
  auth: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    setSession: jest.fn(),
    refreshSession: jest.fn(),
  },
  from: jest.fn(() => createSupabaseQueryChain()),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
      getPublicUrl: jest.fn(),
      createSignedUrl: jest.fn(),
    })),
  },
  realtime: {
    channel: jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  },
  rpc: jest.fn(),
})

// Mock @supabase/supabase-js
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => createSupabaseClientMock()),
}))

// Mock app-specific Supabase clients (reuse the same implementation)
const mockSupabaseClient = createSupabaseClientMock()

jest.mock("../app/clients/supabase/SupabaseClient", () => ({
  __esModule: true,
  default: mockSupabaseClient,
  supabase: mockSupabaseClient,
}))

jest.mock("../app/clients/supabase", () => ({
  __esModule: true,
  default: mockSupabaseClient,
  supabase: mockSupabaseClient,
}))

// Mock react-native-keyboard-controller
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAwareScrollView: ({ children }: any) => children,
  useKeyboardHandler: jest.fn(),
  useReanimatedKeyboardAnimation: jest.fn(() => ({
    height: { value: 0 },
    progress: { value: 0 },
  })),
}))

// Mock react-navigation hooks
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useScrollToTop: jest.fn(),
}))

// Mock react-native-edge-to-edge
jest.mock("react-native-edge-to-edge", () => ({
  SystemBars: ({ children }: any) => children,
  SystemBarStyle: {},
}))

// Mock CSS imports
jest.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}))

// Mock mapbox-gl to prevent import errors in tests
jest.mock("mapbox-gl", () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    remove: jest.fn(),
    addControl: jest.fn(),
    removeControl: jest.fn(),
    resize: jest.fn(),
    flyTo: jest.fn(),
    easeTo: jest.fn(),
    stop: jest.fn(),
    getCenter: jest.fn(() => ({ lng: 0, lat: 0 })),
    getZoom: jest.fn(() => 10),
    getBearing: jest.fn(() => 0),
    getPitch: jest.fn(() => 0),
  })),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    getLngLat: jest.fn(() => ({ lng: 0, lat: 0 })),
  })),
  NavigationControl: jest.fn(),
  AttributionControl: jest.fn(),
  accessToken: "",
}))

// Mock @react-native-community/datetimepicker for mobile testing
// Create proper React component mocks and export to global scope for test access
global.mockNativeDateTimePicker = jest.fn(({ onChange, value, mode, testID, ...props }) => {
  const React = require('react')
  const { View, Text, TouchableOpacity } = require('react-native')
  
  return React.createElement(
    View,
    {
      testID: testID || 'ios-date-time-picker'
    },
    React.createElement(
      TouchableOpacity,
      {
        testID: 'native-picker-button',
        onPress: () => {
          if (onChange) {
            // Simulate native picker selection
            onChange({ type: 'set' }, new Date('2024-12-25T15:30:00.000Z'))
          }
        }
      },
      React.createElement(Text, {}, `Native ${mode} picker`)
    )
  )
})

global.mockDateTimePickerAndroid = {
  open: jest.fn((options) => {
    // Simulate Android picker behavior
    if (options.onChange) {
      setTimeout(() => {
        options.onChange({ type: 'set' }, new Date('2024-12-25T15:30:00.000Z'))
      }, 0)
    }
  }),
  dismiss: jest.fn()
}

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: global.mockNativeDateTimePicker,
  DateTimePickerAndroid: global.mockDateTimePickerAndroid
}))

// Mock react-datepicker for web tests
global.mockReactDatePicker = jest.fn(({ onChange, selected, customInput, placeholderText, ...props }) => {
  const React = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  
  // Clone the customInput and add onPress functionality
  if (customInput) {
    return React.cloneElement(customInput, {
      onPress: () => {
        if (onChange) {
          onChange(new Date('2024-12-25T15:30:00.000Z')) // 24-hour format time
        }
      }
    })
  }
  
  return React.createElement(
    TouchableOpacity,
    {
      testID: 'react-datepicker',
      onPress: () => {
        if (onChange) {
          onChange(new Date('2024-12-25T15:30:00.000Z'))
        }
      }
    },
    React.createElement(Text, {}, selected ? selected.toString() : placeholderText || 'Select date')
  )
})

jest.mock('react-datepicker', () => ({
  __esModule: true,
  default: global.mockReactDatePicker
}))

// Mock CSS import
jest.mock('react-datepicker/dist/react-datepicker.css', () => ({}))

// Mock @rnmapbox/maps globally
jest.mock("@rnmapbox/maps", () => ({
  MapView: ({ children, onPress }: any) => {
    const React = require("react")
    const { View, TouchableOpacity } = require("react-native")
    return React.createElement(
      TouchableOpacity,
      {
        testID: "map-view",
        onPress: () => onPress && onPress({ geometry: { coordinates: [28.9784, 41.0082] } }),
      },
      children,
    )
  },
  Camera: ({ children }: any) => {
    const React = require("react")
    const { View } = require("react-native")
    return React.createElement(View, { testID: "mock-camera" }, children)
  },
  PointAnnotation: ({ children, onDragEnd }: any) => {
    const React = require("react")
    const { TouchableOpacity } = require("react-native")
    return React.createElement(
      TouchableOpacity,
      {
        testID: "point-annotation",
        onPress: () => onDragEnd && onDragEnd({ geometry: { coordinates: [29.0, 41.0] } }),
      },
      children,
    )
  },
  MarkerView: ({ children }: any) => {
    const React = require("react")
    const { View } = require("react-native")
    return React.createElement(View, { testID: "mock-marker-view" }, children)
  },
  ShapeSource: ({ children }: any) => {
    const React = require("react")
    const { View } = require("react-native")
    return React.createElement(View, { testID: "mock-shape-source" }, children)
  },
  SymbolLayer: () => null,
  LineLayer: () => null,
  FillLayer: () => null,
  CircleLayer: () => null,
}))

declare global {
  let __TEST__: boolean
}
