import React from "react"
import { render, screen } from "@testing-library/react-native"

import { MapScreen } from "./MapScreen"
import { useStores } from "@/models/helpers/useStores"
import { ThemeProvider } from "@/theme/context"

// Mock dependencies
jest.mock("@/models/helpers/useStores")
jest.mock("@rnmapbox/maps", () => ({
  MapView: "MapView",
}))
jest.mock("@/clients/supabase/SupabaseClient", () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
    },
  },
}))
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const mockUseStores = useStores as jest.MockedFunction<typeof useStores>

const mockMapStore = {
  isLoading: false,
  loadEventsInBounds: jest.fn(),
}

describe("MapScreen", () => {
  beforeEach(() => {
    mockUseStores.mockReturnValue({
      mapStore: mockMapStore,
    } as any)
    jest.clearAllMocks()
  })

  it("renders map view and search button", () => {
    render(
      <ThemeProvider>
        <MapScreen />
      </ThemeProvider>
    )

    expect(screen.getByText("Search This Area")).toBeOnTheScreen()
  })

  it("disables search button when loading", () => {
    mockUseStores.mockReturnValue({
      mapStore: { ...mockMapStore, isLoading: true },
    } as any)

    render(
      <ThemeProvider>
        <MapScreen />
      </ThemeProvider>
    )

    const searchButton = screen.getByText("Search This Area")
    expect(searchButton).toBeDisabled()
  })
})