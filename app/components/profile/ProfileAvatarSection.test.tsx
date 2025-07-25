import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { render, screen, fireEvent } from "@testing-library/react-native"

import { ThemeProvider } from "@/theme/context"

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
  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider>
        <NavigationContainer>
          <ProfileAvatarSection {...props} />
        </NavigationContainer>
      </ThemeProvider>,
    )
  }

  it("should render correctly with display name", () => {
    renderComponent({ displayName: "John Doe" })

    expect(screen.getByText("John Doe")).toBeOnTheScreen()
    expect(screen.getByText("JD")).toBeOnTheScreen()
  })

  it('should render "common:notSet" when no display name provided', () => {
    renderComponent({ displayName: null })

    expect(screen.getByText("common:notSet")).toBeOnTheScreen()
  })

  it("should show uploading indicator when isUploading is true", () => {
    renderComponent({
      displayName: "John Doe",
      isUploading: true,
    })

    expect(screen.getByText("profile:uploading")).toBeOnTheScreen()
  })

  it("should call onAvatarPress when avatar is pressed", () => {
    const mockOnAvatarPress = jest.fn()
    renderComponent({
      displayName: "John Doe",
      onAvatarPress: mockOnAvatarPress,
    })

    const avatarButton = screen.getByTestId("avatar-button")
    fireEvent.press(avatarButton)

    expect(mockOnAvatarPress).toHaveBeenCalled()
  })
})
