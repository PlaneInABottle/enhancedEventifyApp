import React from 'react'
import { View, ViewStyle } from 'react-native'
import { Text } from "@/components/Text"

import { MapEventInstanceModel } from "@/models/MapModels"

export interface EventCardProps {
  event: typeof MapEventInstanceModel.Type
}

export const EventCard = ({ event }: EventCardProps) => {
  return (
    <View style={$container}>
      <Text preset="subheading">{event.event_title}</Text>
      <Text>{event.venue_name}</Text>
      <Text size="sm">{event.formattedStartTime}</Text>
    </View>
  )
}

const $container: ViewStyle = {
  padding: 16,
  marginVertical: 8,
  marginHorizontal: 16,
  backgroundColor: '#ffffff',
  borderRadius: 8,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
}

// BREADCRUMB: Just added container style for EventCard
// TODO: Add Text import and event content display next