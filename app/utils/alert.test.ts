import { Platform } from 'react-native'
import { Alert } from './alert'

// Mock React Native Alert
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  },
  Alert: {
    alert: jest.fn()
  }
}))

// Mock window methods for web
const mockAlert = jest.fn()
const mockConfirm = jest.fn()
const mockPrompt = jest.fn()

beforeAll(() => {
  global.alert = mockAlert
  global.confirm = mockConfirm
  global.prompt = mockPrompt
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Alert utility', () => {
  describe('mobile platform', () => {
    beforeEach(() => {
      Platform.OS = 'ios'
    })

    it('should call React Native Alert on mobile', () => {
      const RNAlert = require('react-native').Alert
      Alert.simple('Test Title', 'Test Message')
      
      expect(RNAlert.alert).toHaveBeenCalledWith('Test Title', 'Test Message', undefined, undefined)
    })

    it('should handle confirm dialog on mobile', () => {
      const RNAlert = require('react-native').Alert
      const onConfirm = jest.fn()
      const onCancel = jest.fn()
      
      Alert.confirm('Confirm?', 'Are you sure?', onConfirm, onCancel)
      
      expect(RNAlert.alert).toHaveBeenCalledWith(
        'Confirm?',
        'Are you sure?',
        [
          { text: 'Cancel', style: 'cancel', onPress: onCancel },
          { text: 'OK', onPress: onConfirm }
        ],
        undefined
      )
    })
  })

  describe('web platform', () => {
    beforeEach(() => {
      Platform.OS = 'web'
    })

    it('should call window.alert on web for simple alerts', () => {
      Alert.simple('Web Title', 'Web Message')
      
      expect(mockAlert).toHaveBeenCalledWith('Web Title\n\nWeb Message')
    })

    it('should call window.alert with only title if no message', () => {
      Alert.simple('Just Title')
      
      expect(mockAlert).toHaveBeenCalledWith('Just Title')
    })

    it('should handle single button alert on web', () => {
      const onPress = jest.fn()
      Alert.alert('Title', 'Message', [{ text: 'OK', onPress }])
      
      expect(mockAlert).toHaveBeenCalledWith('Title\n\nMessage')
      expect(onPress).toHaveBeenCalled()
    })

    it('should handle confirm dialog on web', () => {
      mockConfirm.mockReturnValue(true)
      const onConfirm = jest.fn()
      const onCancel = jest.fn()
      
      Alert.confirm('Confirm?', 'Are you sure?', onConfirm, onCancel)
      
      expect(mockConfirm).toHaveBeenCalledWith('Confirm?\n\nAre you sure?')
      expect(onConfirm).toHaveBeenCalled()
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('should handle cancel in confirm dialog on web', () => {
      mockConfirm.mockReturnValue(false)
      const onConfirm = jest.fn()
      const onCancel = jest.fn()
      
      Alert.confirm('Confirm?', 'Are you sure?', onConfirm, onCancel)
      
      expect(mockConfirm).toHaveBeenCalledWith('Confirm?\n\nAre you sure?')
      expect(onConfirm).not.toHaveBeenCalled()
      expect(onCancel).toHaveBeenCalled()
    })

    it('should handle multiple buttons with prompt on web', () => {
      mockPrompt.mockReturnValue('2')
      const button1 = jest.fn()
      const button2 = jest.fn()
      const button3 = jest.fn()
      
      Alert.alert(
        'Choose',
        'Pick an option',
        [
          { text: 'Option 1', onPress: button1 },
          { text: 'Option 2', onPress: button2 },
          { text: 'Option 3', onPress: button3 }
        ]
      )
      
      expect(mockPrompt).toHaveBeenCalled()
      expect(button1).not.toHaveBeenCalled()
      expect(button2).toHaveBeenCalled()
      expect(button3).not.toHaveBeenCalled()
    })

    it('should handle dismiss callback when prompt is cancelled', () => {
      mockPrompt.mockReturnValue(null)
      const onDismiss = jest.fn()
      
      Alert.alert(
        'Choose',
        undefined,
        [
          { text: 'Option 1' },
          { text: 'Option 2' },
          { text: 'Option 3' }
        ],
        { onDismiss }
      )
      
      expect(onDismiss).toHaveBeenCalled()
    })
  })
})