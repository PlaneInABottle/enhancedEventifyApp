import React from "react"
import { screen, fireEvent } from "@testing-library/react-native"
import { renderWithProviders, setupComponentTest } from "../../test/helpers/componentTestHelpers"

// Mock WebMapView to avoid mapbox-gl import issues
jest.mock("./WebMapView", () => ({
  WebMapView: ({ onLocationSelect }: any) => {
    const { View, TouchableOpacity, Text } = require("react-native")
    return (
      <View testID="mock-web-map">
        <TouchableOpacity
          testID="mock-map-select"
          onPress={() => onLocationSelect && onLocationSelect({ latitude: 41.0082, longitude: 28.9784 })}
        >
          <Text>Mock Map - Tap to select location</Text>
        </TouchableOpacity>
      </View>
    )
  },
}))

import { LocationPickerModal } from "./LocationPickerModal"

jest.mock("@/i18n/translate", () => ({
  translate: (key: string, options?: any) => {
    const translations: Record<string, string> = {
      "locationPicker:title": "Pick Location",
      "locationPicker:selectedLocation": `Selected: ${options?.latitude || "41.008200"}, ${options?.longitude || "28.978400"}`,
      "locationPicker:dragToSelect": "Drag the marker to select a location",
      "common:cancel": "Cancel",
      "common:save": "Save",
    }
    return translations[key] || key
  },
}))

describe("LocationPickerModal", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
  }

  const renderLocationPicker = (props = {}) => {
    return renderWithProviders(
      <LocationPickerModal {...defaultProps} {...props} />,
      { withStoreProvider: false }
    )
  }

  it("renders correctly when visible", () => {
    renderLocationPicker()

    expect(screen.getByText("Pick Location")).toBeOnTheScreen()
    expect(screen.getByTestId("map-view")).toBeOnTheScreen()
    expect(screen.getByTestId("point-annotation")).toBeOnTheScreen()
    expect(screen.getByText("Cancel")).toBeOnTheScreen()
    expect(screen.getByText("Save")).toBeOnTheScreen()
    expect(screen.getByText("Drag the marker to select a location")).toBeOnTheScreen()
  })

  it("does not render when not visible", () => {
    renderLocationPicker({ visible: false })

    expect(screen.queryByText("Pick Location")).not.toBeOnTheScreen()
  })

  it("displays default coordinates (Istanbul)", () => {
    renderLocationPicker()

    expect(screen.getByText("Selected: 41.008200, 28.978400")).toBeOnTheScreen()
  })

  it("displays initial coordinates when provided", () => {
    const initialCoordinates = { latitude: 40.7128, longitude: -74.006 }
    renderLocationPicker({ initialCoordinates })

    expect(screen.getByText("Selected: 40.712800, -74.006000")).toBeOnTheScreen()
  })

  it("calls onClose when cancel button is pressed", () => {
    const onClose = jest.fn()
    renderLocationPicker({ onClose })

    fireEvent.press(screen.getByTestId("cancel-button"))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onSave and onClose when save button is pressed", () => {
    const onSave = jest.fn()
    const onClose = jest.fn()
    renderLocationPicker({ onSave, onClose })

    fireEvent.press(screen.getByTestId("save-button"))

    expect(onSave).toHaveBeenCalledWith({
      latitude: 41.0082,
      longitude: 28.9784,
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // Note: Testing overlay press is challenging due to React Native Modal's structure
  // The onRequestClose prop handles hardware back button on Android, which serves similar purpose

  it("does not close when modal content is pressed", () => {
    const onClose = jest.fn()
    renderLocationPicker({ onClose })

    fireEvent.press(screen.getByTestId("modal-content"))

    expect(onClose).not.toHaveBeenCalled()
  })

  it("updates coordinates when marker is dragged", () => {
    const onSave = jest.fn()
    renderLocationPicker({ onSave })

    // Simulate marker drag
    fireEvent.press(screen.getByTestId("point-annotation"))

    // Press save to check the updated coordinates
    fireEvent.press(screen.getByTestId("save-button"))

    expect(onSave).toHaveBeenCalledWith({
      longitude: 29.0,
      latitude: 41.0,
    })
  })

  it("resets coordinates when modal reopens with different initial coordinates", () => {
    const firstCoordinates = { latitude: 40.7128, longitude: -74.006 }
    const secondCoordinates = { latitude: 51.5074, longitude: -0.1278 }

    const { rerender } = renderWithProviders(
      <LocationPickerModal
        {...defaultProps}
        visible={true}
        initialCoordinates={firstCoordinates}
      />,
      { withStoreProvider: false }
    )

    expect(screen.getByText("Selected: 40.712800, -74.006000")).toBeOnTheScreen()

    // Rerender with new coordinates
    rerender(
      <LocationPickerModal
        {...defaultProps}
        visible={true}
        initialCoordinates={secondCoordinates}
      />
    )

    expect(screen.getByText("Selected: 51.507400, -0.127800")).toBeOnTheScreen()
  })
})
