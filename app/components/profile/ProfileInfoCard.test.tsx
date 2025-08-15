import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { screen, fireEvent } from "@testing-library/react-native"
import { renderWithProviders, setupComponentTest } from '../../../test/helpers/componentTestHelpers'

import { ProfileInfoCard, ProfileField } from "./ProfileInfoCard"

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

describe("ProfileInfoCard", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const renderProfileInfoCard = (props = {}) => {
    return renderWithProviders(
      <NavigationContainer>
        <ProfileInfoCard {...props} />
      </NavigationContainer>,
      { withStoreProvider: false }
    )
  }

  it("should render with title", () => {
    renderProfileInfoCard({ title: "Profile Information" })

    expect(screen.getByText("Profile Information")).toBeOnTheScreen()
  })

  it("should render with title translation key", () => {
    renderProfileInfoCard({ titleTx: "profile:profileInformation" })

    expect(screen.getByText("profile:profileInformation")).toBeOnTheScreen()
  })

  it("should render view content when not editing", () => {
    const viewContent = <ProfileField label="Name" value="John Doe" />
    renderProfileInfoCard({
      title: "Info",
      viewContent,
      isEditing: false,
    })

    expect(screen.getByText("Name")).toBeOnTheScreen()
    expect(screen.getByText("John Doe")).toBeOnTheScreen()
  })

  it("should render edit content when editing", () => {
    const editContent = <ProfileField label="Edit Name" value="Edit John Doe" />
    const viewContent = <ProfileField label="Name" value="John Doe" />

    renderProfileInfoCard({
      title: "Info",
      viewContent,
      editContent,
      isEditing: true,
    })

    expect(screen.getByText("Edit Name")).toBeOnTheScreen()
    expect(screen.getByText("Edit John Doe")).toBeOnTheScreen()
  })

  it("should call onPress when pressable and pressed", () => {
    const mockOnPress = jest.fn()
    renderProfileInfoCard({
      title: "Info",
      viewContent: <ProfileField label="Name" value="John Doe" />,
      pressable: true,
      onPress: mockOnPress,
    })

    fireEvent.press(screen.getByText("Info"))
    expect(mockOnPress).toHaveBeenCalled()
  })

  it("should render caret icon when pressable and not editing", () => {
    renderProfileInfoCard({
      title: "Info",
      viewContent: <ProfileField label="Name" value="John Doe" />,
      pressable: true,
      isEditing: false,
    })

    // Icon should be present when pressable and not editing
    expect(screen.getByTestId("icon-caretRight")).toBeOnTheScreen()
  })

  it("should render header icon when provided", () => {
    renderProfileInfoCard({
      title: "Profile Information",
      headerIcon: "view",
      viewContent: <ProfileField label="Name" value="John Doe" />,
    })

    expect(screen.getByTestId("icon-view")).toBeOnTheScreen()
  })

  it("should not render caret icon when editing", () => {
    renderProfileInfoCard({
      title: "Info",
      viewContent: <ProfileField label="Name" value="John Doe" />,
      pressable: true,
      isEditing: true,
    })

    expect(screen.queryByTestId("icon-caretRight")).not.toBeOnTheScreen()
  })

  it("should handle missing content gracefully", () => {
    renderProfileInfoCard({
      title: "Empty Card",
    })

    expect(screen.getByText("Empty Card")).toBeOnTheScreen()
    // Should not crash when no content is provided
  })

  it("should use titleTx when both title and titleTx are provided", () => {
    renderProfileInfoCard({
      title: "Direct Title",
      titleTx: "profile:profileInformation",
    })

    // Text component prioritizes tx over text
    expect(screen.getByText("profile:profileInformation")).toBeOnTheScreen()
    expect(screen.queryByText("Direct Title")).not.toBeOnTheScreen()
  })

  it("should show caret icon when pressable even without onPress", () => {
    renderProfileInfoCard({
      title: "Pressable Card",
      viewContent: <ProfileField label="Name" value="John Doe" />,
      pressable: true,
      // No onPress provided
    })

    expect(screen.getByText("Pressable Card")).toBeOnTheScreen()
    // Should show caret icon when pressable is true
    expect(screen.getByTestId("icon-caretRight")).toBeOnTheScreen()
  })

  it("should apply custom styles correctly", () => {
    const customStyle = { marginTop: 20, backgroundColor: "red" }
    renderProfileInfoCard({
      title: "Styled Card",
      viewContent: <ProfileField label="Name" value="John Doe" />,
      style: customStyle,
    })

    expect(screen.getByText("Styled Card")).toBeOnTheScreen()
    // Component should render without crashing with custom styles
  })

  it("should use TouchableOpacity when pressable with onPress", () => {
    const mockOnPress = jest.fn()
    renderProfileInfoCard({
      title: "Touchable Card",
      viewContent: <ProfileField label="Name" value="John Doe" />,
      pressable: true,
      onPress: mockOnPress,
    })

    // Should be pressable
    fireEvent.press(screen.getByText("Touchable Card"))
    expect(mockOnPress).toHaveBeenCalled()
  })

  it("should use View when not pressable", () => {
    renderProfileInfoCard({
      title: "Non-pressable Card",
      viewContent: <ProfileField label="Name" value="John Doe" />,
      pressable: false,
    })

    // Should render but not be pressable
    expect(screen.getByText("Non-pressable Card")).toBeOnTheScreen()
  })
})

describe("ProfileField", () => {
  const renderProfileField = (props = {}) => {
    return renderWithProviders(
      <NavigationContainer>
        <ProfileField {...props} />
      </NavigationContainer>,
      { withStoreProvider: false }
    )
  }

  it("should render with label and value", () => {
    renderProfileField({
      label: "Full Name",
      value: "John Doe",
    })

    expect(screen.getByText("Full Name")).toBeOnTheScreen()
    expect(screen.getByText("John Doe")).toBeOnTheScreen()
  })

  it("should render placeholder when value is empty", () => {
    renderProfileField({
      label: "Bio",
      value: null,
      placeholder: "No bio available",
    })

    expect(screen.getByText("Bio")).toBeOnTheScreen()
    expect(screen.getByText("No bio available")).toBeOnTheScreen()
  })

  it("should render multiline text", () => {
    renderProfileField({
      label: "Description",
      value: "This is a long description that should be multiline",
      multiline: true,
    })

    expect(screen.getByText("Description")).toBeOnTheScreen()
    expect(
      screen.getByText("This is a long description that should be multiline"),
    ).toBeOnTheScreen()
  })

  it("should use translation keys for labels", () => {
    renderProfileField({
      labelTx: "profile:displayName",
      value: "John Doe",
    })

    expect(screen.getByText("profile:displayName")).toBeOnTheScreen()
    expect(screen.getByText("John Doe")).toBeOnTheScreen()
  })

  it("should use placeholder translation key when value is empty", () => {
    renderProfileField({
      label: "Bio",
      value: "",
      placeholderTx: "profile:noBio",
    })

    expect(screen.getByText("Bio")).toBeOnTheScreen()
    expect(screen.getByText("profile:noBio")).toBeOnTheScreen()
  })

  it("should render without label when not provided", () => {
    renderProfileField({
      value: "John Doe",
    })

    expect(screen.getByText("John Doe")).toBeOnTheScreen()
  })

  it("should handle empty value gracefully", () => {
    renderProfileField({
      label: "Description",
      value: "",
      placeholder: "No description",
    })

    expect(screen.getByText("Description")).toBeOnTheScreen()
    expect(screen.getByText("No description")).toBeOnTheScreen()
  })
})
