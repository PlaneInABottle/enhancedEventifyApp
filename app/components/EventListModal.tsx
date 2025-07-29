import React from 'react'
import { View, ViewStyle, TextStyle, Modal, TouchableOpacity } from 'react-native'
import { Text } from '@/components/Text'
import { EventCard } from '@/components/EventCard'
import { ListView } from '@/components/ListView'
import { useAppTheme } from '@/theme/context'
import type { ThemedStyle } from '@/theme/types'
import type { VenueWithEvents } from '@/stores/MapStore'

interface EventListModalProps {
  visible: boolean
  onClose: () => void
  venue: VenueWithEvents | null
}

export const EventListModal = ({ visible, onClose, venue }: EventListModalProps) => {
  const { themed } = useAppTheme()

  if (!venue) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={themed($container)}>
        {/* Header */}
        <View style={themed($header)}>
          <View style={themed($headerContent)}>
            <Text preset="heading" text={venue.venue_name} />
            <Text 
              size="sm" 
              style={themed($addressText)}
              text={venue.full_address}
            />
            <Text 
              size="xs" 
              style={themed($cityText)}
              text={venue.city}
            />
          </View>
          
          <TouchableOpacity 
            onPress={onClose}
            style={themed($closeButton)}
          >
            <Text text="Close" style={themed($closeText)} />
          </TouchableOpacity>
        </View>

        {/* Events List */}
        <View style={themed($eventsContainer)}>
          <Text 
            preset="subheading" 
            text={`${venue.events.length} ${venue.events.length === 1 ? 'Event' : 'Events'}`}
            style={themed($eventsTitle)}
          />
          
          <ListView
            data={venue.events}
            renderItem={({ item }) => <EventCard event={item} />}
            keyExtractor={(item) => item.instance_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={themed($listContainer)}
            estimatedItemSize={120}
          />
        </View>
      </View>
    </Modal>
  )
}

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  backgroundColor: theme.colors.background,
})

const $header: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.separator,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
})

const $headerContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  marginRight: 16,
})

const $addressText: ThemedStyle<ViewStyle> = (theme) => ({
  color: theme.colors.textDim,
  marginTop: theme.spacing.xs,
})

const $cityText: ThemedStyle<ViewStyle> = (theme) => ({
  color: theme.colors.textDim,
  marginTop: theme.spacing.xxs,
})

const $closeButton: ThemedStyle<ViewStyle> = (theme) => ({
  paddingHorizontal: theme.spacing.md,
  paddingVertical: theme.spacing.sm,
  backgroundColor: theme.colors.palette.neutral200,
  borderRadius: 8,
})

const $closeText: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.text,
  fontWeight: '600',
})

const $eventsContainer: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  padding: theme.spacing.lg,
})

const $eventsTitle: ThemedStyle<ViewStyle> = (theme) => ({
  marginBottom: theme.spacing.md,
})

const $listContainer: ThemedStyle<ViewStyle> = (theme) => ({
  paddingBottom: theme.spacing.xl,
})