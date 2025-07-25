import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native"
import { NavigationContainer } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"

import { useStores } from "@/models"
import { ThemeProvider } from "@/theme/context"
import { Alert } from "@/utils/alert"

import { UserProfileScreen } from "./UserProfileScreen"

// Mock the stores
const mockUserProfileStore = {
  isUploading: false,
  error: null,
  clearError: jest.fn(),
  uploadAvatar: jest.fn(),
  fetchProfile: jest.fn(),
}

const mockAuthenticationStore = {
  userId: "test-user-123",
}

jest.mock("@/models", () => ({
  useStores: jest.fn(),
}))

// Mock navigation utilities
jest.mock("@/navigators/navigationUtilities", () => ({
  useHeader: jest.fn(),
}))

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images" },
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))

// Mock Alert
jest.mock("@/utils/alert", () => ({
  Alert: {
    simple: jest.fn(),
  },
}))

const mockUseStores = useStores as jest.MockedFunction<typeof useStores>

describe("UserProfileScreen", () => {
  const defaultProps = {
    navigation: { navigate: jest.fn() } as any,
    route: { key: "UserProfile", name: "UserProfile" as const },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStores.mockReturnValue({
      authenticationStore: mockAuthenticationStore,
      userProfileStore: mockUserProfileStore,
    } as any)
  })

  it("renders the screen with all components", () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <UserProfileScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("avatar-button")).toBeOnTheScreen()
  })

  it("should not attempt upload when userId is null", async () => {
    // Override stores with null userId
    mockUseStores.mockReturnValue({
      authenticationStore: { userId: null },
      userProfileStore: mockUserProfileStore,
    } as any)

    render(
      <ThemeProvider>
        <NavigationContainer>
          <UserProfileScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>,
    )

    const avatarButton = screen.getByTestId("avatar-button")
    fireEvent.press(avatarButton)

    // Should exit early - no ImagePicker calls should be made
    expect(ImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled()
  })

  it("should not attempt upload when already uploading", async () => {
    // Create a new mock with isUploading = true
    const uploadingStore = {
      ...mockUserProfileStore,
      isUploading: true,
    }
    
    mockUseStores.mockReturnValue({
      authenticationStore: mockAuthenticationStore,
      userProfileStore: uploadingStore,
    } as any)

    render(
      <ThemeProvider>
        <NavigationContainer>
          <UserProfileScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>,
    )

    const avatarButton = screen.getByTestId("avatar-button")
    fireEvent.press(avatarButton)

    // Should exit early - no ImagePicker calls should be made
    expect(ImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled()
  })

  it("should show permission alert and stop when permission denied", async () => {
    // Mock permission denied
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: "denied",
    })
    
    render(
      <ThemeProvider>
        <NavigationContainer>
          <UserProfileScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>,
    )

    const avatarButton = screen.getByTestId("avatar-button")
    fireEvent.press(avatarButton)

    await waitFor(() => {
      expect(Alert.simple).toHaveBeenCalledWith(
        "profile:permissionRequired",
        "profile:photoLibraryPermissionMessage"
      )
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled()
    })
  })

  it("should launch image picker with correct options when permitted", async () => {
    // Mock permission granted
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: "granted",
    })
    
    // Mock user canceling the picker
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: true,
    })
    
    render(
      <ThemeProvider>
        <NavigationContainer>
          <UserProfileScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>,
    )

    const avatarButton = screen.getByTestId("avatar-button")
    fireEvent.press(avatarButton)

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
    })
  })

  it("should handle file conversion error without calling uploadAvatar", async () => {
    // Mock permission granted
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: "granted",
    })
    
    // Mock image selection
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://test.jpg", fileName: "test.jpg", mimeType: "image/jpeg" }],
    })
    
    // Mock fetch to fail
    global.fetch = jest.fn().mockRejectedValue(new Error("Failed to fetch"))
    
    render(
      <ThemeProvider>
        <NavigationContainer>
          <UserProfileScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>,
    )

    const avatarButton = screen.getByTestId("avatar-button")
    fireEvent.press(avatarButton)

    await waitFor(() => {
      expect(mockUserProfileStore.uploadAvatar).not.toHaveBeenCalled()
      expect(Alert.simple).toHaveBeenCalledWith(
        "profile:error",
        "Failed to fetch"
      )
    })
  })

  it("should create ArrayBuffer and call uploadAvatar when image selected successfully", async () => {
    // Mock permission granted
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: "granted",
    })
    
    // Mock image selection
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://test.jpg", fileName: "test.jpg", mimeType: "image/jpeg" }],
    })
    
    // Mock successful fetch and arrayBuffer
    const mockArrayBuffer = new ArrayBuffer(8)
    global.fetch = jest.fn().mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
    })
    
    // Mock successful upload
    mockUserProfileStore.uploadAvatar.mockResolvedValue({ success: true })
    
    render(
      <ThemeProvider>
        <NavigationContainer>
          <UserProfileScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>,
    )

    const avatarButton = screen.getByTestId("avatar-button")
    fireEvent.press(avatarButton)

    await waitFor(() => {
      expect(mockUserProfileStore.uploadAvatar).toHaveBeenCalledWith(
        "test-user-123",
        mockArrayBuffer,
        "image/jpeg"
      )
      expect(Alert.simple).toHaveBeenCalledWith(
        "profile:success",
        "profile:avatarUploadedSuccessfully"
      )
    })
  })
})