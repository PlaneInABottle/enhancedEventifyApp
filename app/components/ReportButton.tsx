import React, { useState } from 'react'
import { ViewStyle, Alert } from 'react-native'
import { observer } from 'mobx-react-lite'

import { Button } from './Button'
import { ReportModal } from './ReportModal'
import { useAppTheme } from '@/theme/context'
import { useStores } from '@/models'
import { supabase } from '@/clients/supabase'
import type { ThemedStyle } from '@/theme/types'

export interface ReportButtonProps {
  /**
   * Type of content being reported
   */
  contentType: 'event' | 'venue' | 'business' | 'user'
  /**
   * ID of the content being reported
   */
  contentId: string
  /**
   * Optional style override
   */
  style?: ThemedStyle<ViewStyle>
}

export const ReportButton = observer(function ReportButton(props: ReportButtonProps) {
  const { contentType, contentId, style: $styleOverride } = props
  const { themed } = useAppTheme()
  const { authenticationStore } = useStores()
  
  const [modalVisible, setModalVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReport = async (reason: string, description?: string) => {
    if (!authenticationStore.user?.id) {
      Alert.alert('Error', 'You must be logged in to report content')
      return
    }

    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: authenticationStore.user.id,
          content_type: contentType,
          content_id: contentId,
          reason: reason as any, // Type assertion for enum
          description: description || null,
        })

      if (error) {
        // Handle duplicate report error gracefully
        if (error.code === '23505') { // PostgreSQL unique constraint violation
          Alert.alert('Already Reported', 'You have already reported this content.')
        } else {
          throw error
        }
      } else {
        Alert.alert('Report Submitted', 'Thank you for helping keep our community safe.')
      }
      
      setModalVisible(false)
    } catch (error) {
      console.error('Failed to submit report:', error)
      Alert.alert('Error', 'Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        tx="common:report"
        preset="default"
        style={[themed($button), $styleOverride && themed($styleOverride)].filter(Boolean)}
        onPress={() => setModalVisible(true)}
      />
      
      <ReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleReport}
        isSubmitting={isSubmitting}
      />
    </>
  )
})

const $button: ThemedStyle<ViewStyle> = (theme) => ({
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: theme.colors.border,
  paddingHorizontal: theme.spacing.sm,
  paddingVertical: theme.spacing.xs,
})