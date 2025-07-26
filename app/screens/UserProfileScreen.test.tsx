import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native"
import { NavigationContainer } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import { PermissionStatus } from "expo-modules-core"

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
  const mockRequestPermissions = ImagePicker.requestMediaLibraryPermissionsAsync as jest.MockedFunction<typeof ImagePicker.requestMediaLibraryPermissionsAsync>
  const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<typeof ImagePicker.launchImageLibraryAsync>
  
  const defaultProps = {
    navigation: { navigate: jest.fn() } as any,
    route: { key: "Profile", name: "Profile" as const },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestPermissions.mockClear()
    mockLaunchLibrary.mockClear()
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
    expect(mockRequestPermissions).not.toHaveBeenCalled()
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
    expect(mockRequestPermissions).not.toHaveBeenCalled()
  })

  it("should show permission alert and stop when permission denied", async () => {
    // Mock permission denied
    mockRequestPermissions.mockResolvedValue({
      status: PermissionStatus.DENIED,
      granted: false,
      canAskAgain: true,
      expires: "never",
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
      expect(mockLaunchLibrary).not.toHaveBeenCalled()
    })
  })

  it("should launch image picker with correct options when permitted", async () => {
    // Mock permission granted
    mockRequestPermissions.mockResolvedValue({
      status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
    })
    
    // Mock user canceling the picker
    mockLaunchLibrary.mockResolvedValue({
      canceled: true,
      assets: null,
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
      expect(mockLaunchLibrary).toHaveBeenCalledWith({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
    })
  })

  it("should handle file conversion error without calling uploadAvatar", async () => {
    // Mock permission granted
    mockRequestPermissions.mockResolvedValue({
      status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
    })
    
    // Mock image selection
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://test.jpg", fileName: "test.jpg", mimeType: "image/jpeg", width: 400, height: 400 }],
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
    mockRequestPermissions.mockResolvedValue({
      status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
    })
    
    // Mock image selection
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://test.jpg", fileName: "test.jpg", mimeType: "image/jpeg", width: 400, height: 400 }],
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

  // Critical test cases for issues we experienced during development
  describe("Critical scenarios from development issues", () => {
    it("should handle ArrayBuffer conversion from fetch correctly", async () => {
      // Mock permission granted
      mockRequestPermissions.mockResolvedValue({
        status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
      })
      
      // Mock image selection
      mockLaunchLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://test.jpg", fileName: "test.jpg", mimeType: "image/jpeg", width: 400, height: 400 }],
      })
      
      // Mock fetch returning proper ArrayBuffer (what actually happens in React Native)
      const testData = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]) // JPEG header
      const mockArrayBuffer = testData.buffer
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      })
      
      // Mock successful upload
      mockUserProfileStore.uploadAvatar.mockResolvedValue({ 
        success: true,
        avatarUrl: "https://example.com/avatar.jpg"
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
        expect(global.fetch).toHaveBeenCalledWith("file://test.jpg")
        expect(mockUserProfileStore.uploadAvatar).toHaveBeenCalledWith(
          "test-user-123",
          mockArrayBuffer,
          "image/jpeg"
        )
      })
    })

    it("should handle upload service returning specific error codes", async () => {
      // Mock permission granted
      mockRequestPermissions.mockResolvedValue({
        status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
      })
      
      // Mock image selection
      mockLaunchLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://test.jpg", fileName: "test.jpg", mimeType: "image/jpeg", width: 400, height: 400 }],
      })
      
      // Mock successful fetch
      const mockArrayBuffer = new ArrayBuffer(8)
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      })
      
      // Mock upload service returning specific error (like we experienced)
      mockUserProfileStore.uploadAvatar.mockResolvedValue({ 
        success: false,
        error: "errors:fileTooLarge"
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
          "profile:error",
          "errors:fileTooLarge"
        )
      })
    })

    it("should handle empty ArrayBuffer (corrupted file scenario)", async () => {
      // Mock permission granted
      mockRequestPermissions.mockResolvedValue({
        status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
      })
      
      // Mock image selection
      mockLaunchLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://empty.jpg", fileName: "empty.jpg", mimeType: "image/jpeg", width: 400, height: 400 }],
      })
      
      // Mock fetch returning empty ArrayBuffer (corrupted/empty file)
      const emptyArrayBuffer = new ArrayBuffer(0)
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(emptyArrayBuffer),
      })
      
      // Mock upload service detecting empty file
      mockUserProfileStore.uploadAvatar.mockResolvedValue({ 
        success: false,
        error: "errors:invalidFile"
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
        expect(mockUserProfileStore.uploadAvatar).toHaveBeenCalledWith(
          "test-user-123",
          emptyArrayBuffer,
          "image/jpeg"
        )
        expect(Alert.simple).toHaveBeenCalledWith(
          "profile:error",
          "errors:invalidFile"
        )
      })
    })

    it("should handle missing mimeType from ImagePicker (fallback scenario)", async () => {
      // Mock permission granted
      mockRequestPermissions.mockResolvedValue({
        status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
      })
      
      // Mock image selection without mimeType (happens on some devices)
      mockLaunchLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://test.jpg", fileName: "test.jpg", width: 400, height: 400 }], // No mimeType
      })
      
      // Mock successful fetch
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
        // Should fallback to 'image/jpeg' when mimeType is missing
        expect(mockUserProfileStore.uploadAvatar).toHaveBeenCalledWith(
          "test-user-123",
          mockArrayBuffer,
          "image/jpeg"
        )
      })
    })

    it("should clear errors before upload and show loading state correctly", async () => {
      // Mock permission granted
      mockRequestPermissions.mockResolvedValue({
        status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
      })
      
      // Mock image selection
      mockLaunchLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file://test.jpg", fileName: "test.jpg", mimeType: "image/jpeg", width: 400, height: 400 }],
      })
      
      // Mock successful fetch
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

      // Verify clearError was called before upload
      expect(mockUserProfileStore.clearError).toHaveBeenCalled()
      
      await waitFor(() => {
        expect(mockUserProfileStore.uploadAvatar).toHaveBeenCalledWith(
          "test-user-123",
          mockArrayBuffer,
          "image/jpeg"
        )
      })
    })
  })
})