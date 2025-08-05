import React from "react"
import { render, screen, fireEvent } from "@testing-library/react-native"

import { ThemeProvider } from "@/theme/context"

import { LocationPickerModal } from "./LocationPickerModal"

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

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

jest.mock("@rnmapbox/maps", () => ({
  MapView: ({ children, ...props }: any) => {
    const MockMapView = require("react-native").View
    return (
      <MockMapView testID="map-view" {...props}>
        {children}
      </MockMapView>
    )
  },
  PointAnnotation: ({ children, onDragEnd, ...props }: any) => {
    const MockPointAnnotation = require("react-native").View
    const MockPressable = require("react-native").Pressable
    return (
      <MockPressable
        testID="point-annotation"
        onPress={() => {
          // Simulate drag end with mock coordinates
          if (onDragEnd) {
            onDragEnd({
              geometry: { coordinates: [29.0, 41.0] },
            })
          }
        }}
        {...props}
      >
        {children}
      </MockPressable>
    )
  },
}))

describe("LocationPickerModal", () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
  }

  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders correctly when visible", () => {
    renderWithTheme(<LocationPickerModal {...defaultProps} />)

    expect(screen.getByText("Pick Location")).toBeOnTheScreen()
    expect(screen.getByTestId("map-view")).toBeOnTheScreen()
    expect(screen.getByTestId("point-annotation")).toBeOnTheScreen()
    expect(screen.getByText("Cancel")).toBeOnTheScreen()
    expect(screen.getByText("Save")).toBeOnTheScreen()
    expect(screen.getByText("Drag the marker to select a location")).toBeOnTheScreen()
  })

  it("does not render when not visible", () => {
    renderWithTheme(<LocationPickerModal {...defaultProps} visible={false} />)

    expect(screen.queryByText("Pick Location")).not.toBeOnTheScreen()
  })

  it("displays default coordinates (Istanbul)", () => {
    renderWithTheme(<LocationPickerModal {...defaultProps} />)

    expect(screen.getByText("Selected: 41.008200, 28.978400")).toBeOnTheScreen()
  })

  it("displays initial coordinates when provided", () => {
    const initialCoordinates = { latitude: 40.7128, longitude: -74.006 }
    renderWithTheme(
      <LocationPickerModal {...defaultProps} initialCoordinates={initialCoordinates} />,
    )

    expect(screen.getByText("Selected: 40.712800, -74.006000")).toBeOnTheScreen()
  })

  it("calls onClose when cancel button is pressed", () => {
    const onClose = jest.fn()
    renderWithTheme(<LocationPickerModal {...defaultProps} onClose={onClose} />)

    fireEvent.press(screen.getByTestId("cancel-button"))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onSave and onClose when save button is pressed", () => {
    const onSave = jest.fn()
    const onClose = jest.fn()
    renderWithTheme(<LocationPickerModal {...defaultProps} onSave={onSave} onClose={onClose} />)

    fireEvent.press(screen.getByTestId("save-button"))

    expect(onSave).toHaveBeenCalledWith({
      latitude: 41.0082,
      longitude: 28.9784,
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when overlay is pressed", () => {
    const onClose = jest.fn()
    renderWithTheme(<LocationPickerModal {...defaultProps} onClose={onClose} />)

    fireEvent.press(screen.getByTestId("modal-overlay"))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("does not close when modal content is pressed", () => {
    const onClose = jest.fn()
    renderWithTheme(<LocationPickerModal {...defaultProps} onClose={onClose} />)

    fireEvent.press(screen.getByTestId("modal-content"))

    expect(onClose).not.toHaveBeenCalled()
  })

  it("updates coordinates when marker is dragged", () => {
    const onSave = jest.fn()
    renderWithTheme(<LocationPickerModal {...defaultProps} onSave={onSave} />)

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

    const { rerender } = renderWithTheme(
      <LocationPickerModal
        {...defaultProps}
        visible={true}
        initialCoordinates={firstCoordinates}
      />,
    )

    expect(screen.getByText("Selected: 40.712800, -74.006000")).toBeOnTheScreen()

    // Rerender with new coordinates
    rerender(
      <ThemeProvider>
        <LocationPickerModal
          {...defaultProps}
          visible={true}
          initialCoordinates={secondCoordinates}
        />
      </ThemeProvider>,
    )

    expect(screen.getByText("Selected: 51.507400, -0.127800")).toBeOnTheScreen()
  })
})
