import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { screen, fireEvent } from "@testing-library/react-native"
import { renderWithProviders, setupComponentTest } from '../../../test/helpers/componentTestHelpers'

import { ProfileAvatarSection } from "./ProfileAvatarSection"

// Mock the profile helpers
jest.mock("@/services/profile/profileHelpers", () => ({
  getInitials: jest.fn((name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
  }),
}))

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

describe("ProfileAvatarSection", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const renderProfileAvatarSection = (props = {}) => {
    return renderWithProviders(
      <NavigationContainer>
        <ProfileAvatarSection {...props} />
      </NavigationContainer>,
      { withStoreProvider: false }
    )
  }

  it("should render correctly with display name", () => {
    renderProfileAvatarSection({ displayName: "John Doe" })

    expect(screen.getByText("John Doe")).toBeOnTheScreen()
    expect(screen.getByText("JD")).toBeOnTheScreen()
  })

  it('should render "common:notSet" when no display name provided', () => {
    renderProfileAvatarSection({ displayName: null })

    expect(screen.getByText("common:notSet")).toBeOnTheScreen()
  })

  it("should show uploading indicator when isUploading is true", () => {
    renderProfileAvatarSection({
      displayName: "John Doe",
      isUploading: true,
    })

    expect(screen.getByText("profile:uploading")).toBeOnTheScreen()
  })

  it("should call onAvatarPress when avatar is pressed", () => {
    const mockOnAvatarPress = jest.fn()
    renderProfileAvatarSection({
      displayName: "John Doe",
      onAvatarPress: mockOnAvatarPress,
    })

    const avatarButton = screen.getByTestId("avatar-button")
    fireEvent.press(avatarButton)

    expect(mockOnAvatarPress).toHaveBeenCalled()
  })
})
