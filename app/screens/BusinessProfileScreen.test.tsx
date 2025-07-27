import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { render, screen } from "@testing-library/react-native"

import { useStores } from "@/models"
import { ThemeProvider } from "@/theme/context"

import { BusinessProfileScreen } from "./BusinessProfileScreen"

// Mock the stores
const mockBusinessProfileStore = {
  profile: null,
  isLoading: false,
  isUpdating: false,
  isUploading: false,
  lastError: null,
  hasProfile: false,
  businessName: null,
  businessTypes: [],
  description: null,
  phone: null,
  websiteUrl: null,
  logoUrl: null,
  businessStatus: "pending",
  fetchProfile: jest.fn(),
  updateProfile: jest.fn(),
  uploadLogo: jest.fn(),
}

const mockAuthenticationStore = {
  userId: "test-user-id",
}

jest.mock("@/models", () => ({
  useStores: jest.fn(),
}))

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const mockUseStores = useStores as jest.MockedFunction<typeof useStores>

describe("BusinessProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStores.mockReturnValue({
      authenticationStore: mockAuthenticationStore,
      businessProfileStore: mockBusinessProfileStore,
    } as any)
  })

  it("renders the screen with business logo section", () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <BusinessProfileScreen />
        </NavigationContainer>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("avatar-button")).toBeOnTheScreen()
  })
})
