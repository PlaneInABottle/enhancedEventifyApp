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

jest.mock("../app/i18n/index.ts", () => ({
  i18n: {
    isInitialized: true,
    language: "en",
    t: (key: string, params: Record<string, string>) => {
      return `${key} ${JSON.stringify(params)}`
    },
    numberToCurrency: jest.fn(),
  },
}))

declare const tron

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
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
