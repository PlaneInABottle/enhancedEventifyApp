import React from 'react'
import { View, ViewStyle, TextStyle, TouchableOpacity } from 'react-native'
import { Text } from '@/components/Text'
import { useAppTheme } from '@/theme/context'
import type { ThemedStyle } from '@/theme/types'
import type { VenueWithEvents } from '@/stores/MapStore'

interface VenuePinContentProps {
  venue: VenueWithEvents
  onPress?: () => void
}

export const VenuePinContent = ({ venue, onPress }: VenuePinContentProps) => {
  const { themed } = useAppTheme()
  const eventCount = venue.events.length
  const isMultipleEvents = eventCount > 1

  const content = (
    <View style={themed(isMultipleEvents ? $multiEventPin : $singleEventPin)}>
      <Text 
        text={eventCount.toString()} 
        style={themed($pinText)}
        size="xs"
      />
    </View>
  )

  return onPress ? (
    <TouchableOpacity onPress={onPress}>
      {content}
    </TouchableOpacity>
  ) : content
}

const $singleEventPin: ThemedStyle<ViewStyle> = (theme) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: theme.colors.palette.primary500,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: theme.colors.palette.neutral100,
})

const $multiEventPin: ThemedStyle<ViewStyle> = (theme) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: theme.colors.palette.secondary500,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 3,
  borderColor: theme.colors.palette.neutral100,
})

const $pinText: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.palette.neutral100,
  fontWeight: 'bold',
  textAlign: 'center',
})