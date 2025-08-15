import React from "react"
import { screen, fireEvent } from "@testing-library/react-native"
import type { IVenue } from "@/models/VenueModels"
import { VenueEditModal } from "./VenueEditModal"
import { renderWithProviders, setupComponentTest, createMockTranslations } from '../../test/helpers/componentTestHelpers'

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock Turkish cities
jest.mock("@/constants/cities", () => ({
  createTurkishCityOptions: () => [
    { label: "İstanbul", value: "istanbul" },
    { label: "Ankara", value: "ankara" },
    { label: "İzmir", value: "izmir" },
  ],
}))

// Mock translate function
jest.mock("@/i18n/translate", () => ({
  translate: (key: string, options?: any) => {
    const translations: Record<string, string> = {
      "venueModal:addTitle": "Add New Venue",
      "venueModal:editTitle": "Edit Venue",
      "venueModal:basicInformation": "Basic Information",
      "venueModal:venueName": "Venue Name",
      "venueModal:venueNamePlaceholder": "Enter venue name",
      "venueModal:description": "Description",
      "venueModal:descriptionPlaceholder": "Describe your venue (optional)",
      "venueModal:capacity": "Capacity",
      "venueModal:capacityPlaceholder": "Maximum capacity (optional)",
      "venueModal:address": "Address",
      "venueModal:fullAddress": "Full Address",
      "venueModal:fullAddressPlaceholder": "Enter full address",
      "venueModal:city": "City",
      "venueModal:cityPlaceholder": "Select city",
      "venueModal:postalCode": "Postal Code",
      "venueModal:postalCodePlaceholder": "Postal code (optional)",
      "venueModal:pickLocationOnMap": "Pick Location on Map",
      "venueModal:selectedCoordinates": `Location: ${options?.latitude || "41.008200"}, ${options?.longitude || "28.978400"}`,
      "venueModal:saveChanges": "Save Changes",
      "common:cancel": "Cancel",
      // Validation error messages
      "errors:venueNameRequired": "Venue name is required",
      "errors:venueNameTooShort": "Venue name must be at least 2 characters long",
      "errors:venueNameTooLong": "Venue name cannot exceed 100 characters",
      "errors:venueDescriptionTooLong": "Description cannot exceed 500 characters",
      "errors:venueCapacityInvalid": "Capacity must be a valid positive number",
      "errors:venueCapacityTooLarge": "Capacity cannot exceed 100,000",
      "errors:addressTooLong": "Address cannot exceed 200 characters",
      "errors:postalCodeInvalid": "Postal code must be exactly 5 digits",
    }
    return translations[key] || key
  },
}))

// Helper function to render VenueEditModal with shared utilities
const renderVenueEditModal = (props: Partial<React.ComponentProps<typeof VenueEditModal>> = {}) => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    venue: null,
  }
  return renderWithProviders(
    <VenueEditModal {...defaultProps} {...props} />,
    { withStoreProvider: false }
  )
}

// Mock venue data compatible with IVenue interface
const mockVenue = {
  id: "test-venue-id",
  business_id: "test-business-id",
  address_id: "test-address-id",
  name: "Test Venue",
  description: "A test venue for testing",
  capacity: 100,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  address: {
    id: "test-address-id",
    full_address: "123 Test Street",
    city: "İstanbul",
    country: "Turkey",
    postal_code: "34000",
    coordinates: {
      type: "Point" as const,
      coordinates: [29.0, 41.0] as [number, number],
    },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
} as unknown as IVenue

describe("VenueEditModal", () => {
  const mockOnClose = jest.fn()
  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Basic Rendering", () => {
    test("renders modal when visible", () => {
      renderVenueEditModal({
        visible: true,
        onClose: mockOnClose,
        onSave: mockOnSave,
      })

      expect(screen.getByText("Add New Venue")).toBeOnTheScreen()
      expect(screen.getByText("Cancel")).toBeOnTheScreen()
      expect(screen.getByText("Save Changes")).toBeOnTheScreen()
    })

    test("does not render modal when not visible", () => {
      renderVenueEditModal({
        visible: false,
        onClose: mockOnClose,
        onSave: mockOnSave,
      })

      expect(screen.queryByText("Add New Venue")).not.toBeOnTheScreen()
    })

    test("renders edit mode title when venue provided", () => {
      renderVenueEditModal({
        visible: true,
        venue: mockVenue,
        onClose: mockOnClose,
        onSave: mockOnSave,
      })

      expect(screen.getByText("Edit Venue")).toBeOnTheScreen()
    })
  })

  describe("Form Fields", () => {
    test("renders all form fields", () => {
      renderVenueEditModal()

      // Basic info fields
      expect(screen.getByPlaceholderText("Enter venue name")).toBeOnTheScreen()
      expect(screen.getByPlaceholderText("Describe your venue (optional)")).toBeOnTheScreen()
      expect(screen.getByPlaceholderText("Maximum capacity (optional)")).toBeOnTheScreen()

      // Address fields
      expect(screen.getByPlaceholderText("Enter full address")).toBeOnTheScreen()
      expect(screen.getByPlaceholderText("Postal code (optional)")).toBeOnTheScreen()
    })

    test("populates form fields when editing existing venue", () => {
      renderVenueEditModal({
        venue: mockVenue,
      })

      expect(screen.getByDisplayValue("Test Venue")).toBeOnTheScreen()
      expect(screen.getByDisplayValue("A test venue for testing")).toBeOnTheScreen()
      expect(screen.getByDisplayValue("100")).toBeOnTheScreen()
      expect(screen.getByDisplayValue("123 Test Street")).toBeOnTheScreen()
      expect(screen.getByDisplayValue("34000")).toBeOnTheScreen()
    })
  })

  describe("Form Interactions", () => {
    test("updates venue name field", () => {
      renderVenueEditModal()

      const nameInput = screen.getByPlaceholderText("Enter venue name")
      fireEvent.changeText(nameInput, "New Venue Name")

      expect(screen.getByDisplayValue("New Venue Name")).toBeOnTheScreen()
    })

    test("updates description field", () => {
      renderVenueEditModal()

      const descriptionInput = screen.getByPlaceholderText("Describe your venue (optional)")
      fireEvent.changeText(descriptionInput, "New venue description")

      expect(screen.getByDisplayValue("New venue description")).toBeOnTheScreen()
    })

    test("updates capacity field with numeric input only", () => {
      renderVenueEditModal()

      const capacityInput = screen.getByPlaceholderText("Maximum capacity (optional)")
      fireEvent.changeText(capacityInput, "abc123def")

      // Should only keep numeric characters
      expect(screen.getByDisplayValue("123")).toBeOnTheScreen()
    })

    test("updates address fields", () => {
      renderVenueEditModal()

      const addressInput = screen.getByPlaceholderText("Enter full address")
      fireEvent.changeText(addressInput, "456 New Address")

      const postalCodeInput = screen.getByPlaceholderText("Postal code (optional)")
      fireEvent.changeText(postalCodeInput, "54321")

      expect(screen.getByDisplayValue("456 New Address")).toBeOnTheScreen()
      expect(screen.getByDisplayValue("54321")).toBeOnTheScreen()
    })
  })

  describe("Button Actions", () => {
    test("calls onClose when Cancel button pressed", () => {
      renderVenueEditModal({
        onClose: mockOnClose,
      })

      const cancelButton = screen.getByText("Cancel")
      fireEvent.press(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test("calls onSave with form data when Save button pressed", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      // Fill out the form
      fireEvent.changeText(screen.getByPlaceholderText("Enter venue name"), "Test Venue")
      fireEvent.changeText(
        screen.getByPlaceholderText("Describe your venue (optional)"),
        "Test Description",
      )
      fireEvent.changeText(screen.getByPlaceholderText("Maximum capacity (optional)"), "150")
      fireEvent.changeText(screen.getByPlaceholderText("Enter full address"), "123 Test St")
      fireEvent.changeText(screen.getByPlaceholderText("Postal code (optional)"), "12345")

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith({
        name: "Test Venue",
        description: "Test Description",
        capacity: "150",
        address: {
          full_address: "123 Test St",
          city: "İstanbul", // Default city
          postal_code: "12345",
        },
      })
    })

    test("calls onSave with existing venue data when editing", () => {
      renderVenueEditModal({
        venue: mockVenue,
        onSave: mockOnSave,
      })

      // Modify the name
      fireEvent.changeText(screen.getByDisplayValue("Test Venue"), "Updated Venue Name")

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith({
        name: "Updated Venue Name",
        description: "A test venue for testing",
        capacity: "100",
        address: {
          full_address: "123 Test Street",
          city: "İstanbul",
          postal_code: "34000",
          coordinates: {
            latitude: 41,
            longitude: 29,
          },
        },
      })
    })
  })

  describe("Form Sections", () => {
    test("displays basic information section", () => {
      renderVenueEditModal()

      expect(screen.getByText("Basic Information")).toBeOnTheScreen()
      expect(screen.getByText("Venue Name")).toBeOnTheScreen()
      expect(screen.getByText("Description")).toBeOnTheScreen()
      expect(screen.getByText("Capacity")).toBeOnTheScreen()
    })

    test("displays address section", () => {
      renderVenueEditModal()

      expect(screen.getByText("Address")).toBeOnTheScreen()
      expect(screen.getByText("Full Address")).toBeOnTheScreen()
      expect(screen.getByText("City")).toBeOnTheScreen()
      expect(screen.getByText("Postal Code")).toBeOnTheScreen()
    })
  })

  describe("Form Validation", () => {
    test("shows error when venue name is empty", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      // Should show validation error and not call onSave
      expect(screen.getByText("Venue name is required")).toBeOnTheScreen()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    test("shows error when venue name is too short", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      const nameInput = screen.getByPlaceholderText("Enter venue name")
      fireEvent.changeText(nameInput, "A")

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      expect(screen.getByText("Venue name must be at least 2 characters long")).toBeOnTheScreen()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    test("shows error when venue name is too long", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      const nameInput = screen.getByPlaceholderText("Enter venue name")
      fireEvent.changeText(nameInput, "A".repeat(101)) // 101 characters

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      expect(screen.getByText("Venue name cannot exceed 100 characters")).toBeOnTheScreen()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    test("shows error when description is too long", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      const nameInput = screen.getByPlaceholderText("Enter venue name")
      fireEvent.changeText(nameInput, "Valid Venue Name")

      const descriptionInput = screen.getByPlaceholderText("Describe your venue (optional)")
      fireEvent.changeText(descriptionInput, "A".repeat(501)) // 501 characters

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      expect(screen.getByText("Description cannot exceed 500 characters")).toBeOnTheScreen()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    test("shows error when capacity is invalid", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      const nameInput = screen.getByPlaceholderText("Enter venue name")
      fireEvent.changeText(nameInput, "Valid Venue Name")

      const capacityInput = screen.getByPlaceholderText("Maximum capacity (optional)")
      fireEvent.changeText(capacityInput, "0") // Invalid capacity

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      expect(screen.getByText("Capacity must be a valid positive number")).toBeOnTheScreen()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    test("shows error when capacity is too large", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      const nameInput = screen.getByPlaceholderText("Enter venue name")
      fireEvent.changeText(nameInput, "Valid Venue Name")

      const capacityInput = screen.getByPlaceholderText("Maximum capacity (optional)")
      fireEvent.changeText(capacityInput, "100001") // Too large

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      expect(screen.getByText("Capacity cannot exceed 100,000")).toBeOnTheScreen()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    test("shows error when postal code is invalid", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      const nameInput = screen.getByPlaceholderText("Enter venue name")
      fireEvent.changeText(nameInput, "Valid Venue Name")

      const postalCodeInput = screen.getByPlaceholderText("Postal code (optional)")
      fireEvent.changeText(postalCodeInput, "123") // Invalid postal code

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      expect(screen.getByText("Postal code must be exactly 5 digits")).toBeOnTheScreen()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    test("clears errors when user starts typing", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      // First trigger validation error
      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)
      expect(screen.getByText("Venue name is required")).toBeOnTheScreen()

      // Then start typing to clear error
      const nameInput = screen.getByPlaceholderText("Enter venue name")
      fireEvent.changeText(nameInput, "Valid Name")

      expect(screen.queryByText("Venue name is required")).not.toBeOnTheScreen()
    })

    test("submits valid form successfully", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      const nameInput = screen.getByPlaceholderText("Enter venue name")
      fireEvent.changeText(nameInput, "Valid Venue Name")

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith({
        name: "Valid Venue Name",
        description: "",
        capacity: "",
        address: {
          full_address: "",
          city: "İstanbul",
          postal_code: "",
        },
      })
    })
  })

  describe("Edge Cases", () => {
    test("handles empty form submission with validation", () => {
      renderVenueEditModal({
        onSave: mockOnSave,
      })

      const saveButton = screen.getByText("Save Changes")
      fireEvent.press(saveButton)

      // Should show validation error instead of calling onSave
      expect(screen.getByText("Venue name is required")).toBeOnTheScreen()
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    test("handles venue with partial address data", () => {
      const partialVenue = {
        ...mockVenue,
        address: {
          ...mockVenue.address,
          full_address: "Incomplete Address",
          city: "Ankara",
          postal_code: "",
        },
      } as unknown as IVenue

      renderVenueEditModal({
        venue: partialVenue,
      })

      expect(screen.getByDisplayValue("Incomplete Address")).toBeOnTheScreen()
      // Postal code field should be empty
      const postalCodeField = screen.getByPlaceholderText("Postal code (optional)")
      expect(postalCodeField.props.value).toBe("")
    })

    test("handles capacity field with zero value", () => {
      renderVenueEditModal()

      const capacityInput = screen.getByPlaceholderText("Maximum capacity (optional)")
      fireEvent.changeText(capacityInput, "0")

      expect(screen.getByDisplayValue("0")).toBeOnTheScreen()
    })
  })

  describe("Location Picker Integration", () => {
    test("renders location picker button", () => {
      renderVenueEditModal()

      expect(screen.getByText("Pick Location on Map")).toBeOnTheScreen()
    })

    test("does not show coordinates when none are selected", () => {
      renderVenueEditModal()

      expect(screen.queryByText(/Location:/)).not.toBeOnTheScreen()
    })

    test("shows coordinates when venue has location data", () => {
      const venueWithLocation = {
        ...mockVenue,
        address: {
          ...mockVenue.address,
          latitude: 41.0082,
          longitude: 28.9784,
        },
      } as unknown as IVenue

      renderVenueEditModal({
        venue: venueWithLocation,
      })

      expect(screen.getByText("Location: 41.000000, 29.000000")).toBeOnTheScreen()
    })
  })
})
