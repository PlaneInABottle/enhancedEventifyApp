import React from 'react'
import { Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { render, fireEvent, waitFor, within } from '@testing-library/react-native'
import { RootStoreProvider, setupRootStore, RootStoreModel } from '@/models'
import { BusinessEventNavigator } from '@/navigators/BusinessEventNavigator'
import * as businessEventService from '@/services/event/businessEventService'
import type { CreateEventResult } from '@/services/event/businessEventTypes'

// Mock dependencies
jest.mock('@/services/event/businessEventService')
jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } })
    }
  }
}))

// Mock navigation
const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}))

describe('Business Event Creation and Editing Flow', () => {
  let rootStore: any

  beforeEach(async () => {
    jest.clearAllMocks()
    Alert.alert = jest.fn()
    
    // Setup root store with test data
    const store = RootStoreModel.create({})
    const { rootStore: rs } = await setupRootStore(store)
    rootStore = rs
    
    // Setup business profile
    rootStore.businessProfileStore.setProfile({
      id: 'business-123',
      user_id: 'user-123',
      business_name: 'Test Business',
      business_type: 'restaurant',
      description: 'Test Description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    
    // Setup venues
    rootStore.venueStore.setVenues([
      {
        id: 'venue-1',
        business_id: 'business-123',
        name: 'Main Venue',
        address: { street: '123 Main St', city: 'Test City', country: 'Test Country' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'venue-2', 
        business_id: 'business-123',
        name: 'Second Venue',
        address: { street: '456 Second St', city: 'Test City', country: 'Test Country' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ])
  })

  const renderNavigator = () => {
    return render(
      <RootStoreProvider value={rootStore}>
        <NavigationContainer>
          <BusinessEventNavigator />
        </NavigationContainer>
      </RootStoreProvider>
    )
  }

  describe('Event Creation Flow', () => {
    it('creates an event with multiple instances successfully', async () => {
      // Mock successful creation
      const mockCreateResult: CreateEventResult = {
        success: true,
        event: {
          id: 'event-123',
          business_id: 'business-123',
          title: 'New Event',
          description: 'Event Description',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        eventInstances: [
          {
            id: 'instance-1',
            event_id: 'event-123',
            venue_id: 'venue-1',
            start_datetime: '2025-12-25T10:00:00Z',
            end_datetime: '2025-12-25T12:00:00Z',
            event_instance_status: 'published',
            max_attendees: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]
      }
      ;(businessEventService.createEvent as jest.Mock).mockResolvedValue(mockCreateResult)

      const { getByText, getByPlaceholderText, getByTestId } = renderNavigator()
      
      // Navigate to create event
      await waitFor(() => {
        fireEvent.press(getByText('Create New Event'))
      })
      
      // Wait for form to load
      await waitFor(() => {
        expect(getByText('Create Event')).toBeTruthy()
      })
      
      // Fill in event details
      fireEvent.changeText(getByPlaceholderText('Enter event title'), 'New Event')
      fireEvent.changeText(getByPlaceholderText('Enter event description (optional)'), 'Event Description')
      
      // Fill in instance details
      const venueDropdown = getByTestId('dropdown-instance-0-venue')
      fireEvent.press(venueDropdown)
      fireEvent.press(getByText('Main Venue'))
      
      fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD HH:MM'), '2025-12-25 10:00')
      fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD HH:MM'), '2025-12-25 12:00')
      fireEvent.changeText(getByPlaceholderText('Optional'), '100')
      
      // Submit form
      fireEvent.press(getByText('Create Event'))
      
      await waitFor(() => {
        expect(businessEventService.createEvent).toHaveBeenCalledWith('business-123', {
          title: 'New Event',
          description: 'Event Description',
          instances: [{
            venue_id: 'venue-1',
            start_datetime: '2025-12-25 10:00',
            end_datetime: '2025-12-25 12:00',
            max_attendees: '100',
            event_instance_status: 'draft',
          }]
        })
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Event created successfully!')
        expect(mockGoBack).toHaveBeenCalled()
      })
    })
    
    it('handles validation errors properly', async () => {
      const { getByText, getByPlaceholderText } = renderNavigator()
      
      // Navigate to create event
      await waitFor(() => {
        fireEvent.press(getByText('Create New Event'))
      })
      
      await waitFor(() => {
        expect(getByText('Create Event')).toBeTruthy()
      })
      
      // Try to submit without filling required fields
      fireEvent.press(getByText('Create Event'))
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          'Please fix all errors before submitting.'
        )
      })
    })
  })

  describe('Event Editing Flow', () => {
    beforeEach(() => {
      // Add an existing event to the store
      rootStore.businessEventStore.setProp('events', [{
        id: 'event-123',
        business_id: 'business-123',
        title: 'Existing Event',
        description: 'Existing Description',
        imageUrl: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        instances: [{
          id: 'instance-1',
          event_id: 'event-123',
          venue_id: 'venue-1',
          start_datetime: '2025-12-25T10:00:00Z',
          end_datetime: '2025-12-25T12:00:00Z',
          event_instance_status: 'published',
          max_attendees: 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      }])
    })

    it('loads existing event data and updates successfully', async () => {
      // Mock successful update
      const mockUpdateResult = {
        success: true,
        event: {
          id: 'event-123',
          business_id: 'business-123', 
          title: 'Updated Event',
          description: 'Updated Description',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
      
      const mockEvent = rootStore.businessEventStore.getEventById('event-123')
      mockEvent.update = jest.fn().mockResolvedValue(mockUpdateResult)
      mockEvent.instances[0].update = jest.fn().mockResolvedValue({ success: true })

      const { getByText, getByDisplayValue, getByTestId } = renderNavigator()
      
      // Click on the event to edit (this now goes to edit directly)
      await waitFor(() => expect(getByTestId('event-card')).toBeTruthy())
      fireEvent.press(getByTestId('event-card'))
      
      await waitFor(() => {
        expect(getByText('Edit Event')).toBeTruthy()
        expect(getByDisplayValue('Existing Event')).toBeTruthy()
        expect(getByDisplayValue('Existing Description')).toBeTruthy()
      })
      
      // Update event details
      const titleInput = getByDisplayValue('Existing Event')
      fireEvent.changeText(titleInput, 'Updated Event')
      
      const descriptionInput = getByDisplayValue('Existing Description')
      fireEvent.changeText(descriptionInput, 'Updated Description')
      
      // Submit update
      fireEvent.press(getByText('Update Event'))
      
      await waitFor(() => {
        expect(mockEvent.update).toHaveBeenCalledWith({
          title: 'Updated Event',
          description: 'Updated Description',
        })
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Event updated successfully!')
        expect(mockGoBack).toHaveBeenCalled()
      })
    })
    
    it('handles adding new instances to existing event', async () => {
      const mockEvent = rootStore.businessEventStore.getEventById('event-123')
      mockEvent.update = jest.fn().mockResolvedValue({ success: true })
      mockEvent.addNewInstance = jest.fn().mockResolvedValue({ success: true })

      const { getByText, getByTestId, getAllByPlaceholderText } = renderNavigator()
      
      // Navigate to edit
      await waitFor(() => expect(getByTestId('event-card')).toBeTruthy())
      fireEvent.press(getByTestId('event-card'))
      
      await waitFor(() => {
        expect(getByText('Edit Event')).toBeTruthy()
      })
      
      // Add a new instance
      fireEvent.press(getByText('Add Instance'))
      
      // Fill new instance details
      const venueDropdown = getByTestId('dropdown-instance-1-venue')
      fireEvent.press(venueDropdown)
      fireEvent.press(getByText('Second Venue'))
      
      const startDateInputs = getAllByPlaceholderText('YYYY-MM-DD HH:MM')
      fireEvent.changeText(startDateInputs[2], '2025-12-26 14:00') // New instance start
      fireEvent.changeText(startDateInputs[3], '2025-12-26 16:00') // New instance end
      
      // Submit
      fireEvent.press(getByText('Update Event'))
      
      await waitFor(() => {
        expect(mockEvent.addNewInstance).toHaveBeenCalledWith({
          venue_id: 'venue-2',
          start_datetime: '2025-12-26 14:00',
          end_datetime: '2025-12-26 16:00',
          max_attendees: undefined,
          event_instance_status: 'draft',
        })
      })
    })
  })

  describe('Event List Interactions', () => {
    beforeEach(() => {
      // Add multiple events
      rootStore.businessEventStore.setProp('events', [
        {
          id: 'event-1',
          business_id: 'business-123',
          title: 'First Event',
          description: 'First Description',
          imageUrl: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          instances: [{
            id: 'instance-1',
            event_id: 'event-1',
            venue_id: 'venue-1',
            start_datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            end_datetime: new Date(Date.now() + 90000000).toISOString(),
            event_instance_status: 'published',
            max_attendees: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]
        },
        {
          id: 'event-2',
          business_id: 'business-123',
          title: 'Second Event',
          description: null,
          imageUrl: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          instances: [{
            id: 'instance-2',
            event_id: 'event-2',
            venue_id: 'venue-2',
            start_datetime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            end_datetime: new Date(Date.now() - 82800000).toISOString(),
            event_instance_status: 'completed',
            max_attendees: 200,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]
        }
      ])
    })

    it('displays events grouped by status', async () => {
      const { getByText, queryByText } = renderNavigator()
      
      await waitFor(() => {
        // Upcoming events section
        expect(getByText('Upcoming Events')).toBeTruthy()
        expect(getByText('First Event')).toBeTruthy()
        
        // Past events section  
        expect(getByText('Past Events')).toBeTruthy()
        expect(getByText('Second Event')).toBeTruthy()
        
        // Event details
        expect(getByText('First Description')).toBeTruthy()
        expect(queryByText('null')).toBeFalsy() // Ensure null description doesn't show
      })
    })
    
    it('handles event deletion with confirmation', async () => {
      const mockEvent = rootStore.businessEventStore.getEventById('event-1')
      mockEvent.delete = jest.fn().mockResolvedValue({ success: true })

      const { getByText, getAllByText } = renderNavigator()
      
      await waitFor(() => {
        expect(getByText('First Event')).toBeTruthy()
      })
      
      // Press delete button
      const deleteButtons = getAllByText('Delete')
      fireEvent.press(deleteButtons[0])
      
      // Verify confirmation dialog
      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Event',
        "Are you sure you want to delete 'First Event'? This action cannot be undone.",
        expect.any(Array)
      )
      
      // Simulate pressing confirm
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0]
      const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Delete')
      confirmButton.onPress()
      
      await waitFor(() => {
        expect(mockEvent.delete).toHaveBeenCalled()
      })
    })
  })
})