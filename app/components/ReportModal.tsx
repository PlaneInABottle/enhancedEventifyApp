import React, { useState } from 'react'
import {
  View,
  Modal,
  ViewStyle,
  TextStyle,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { observer } from 'mobx-react-lite'

import { Text } from './Text'
import { Button } from './Button'
import { TextField } from './TextField'
import { useAppTheme } from '@/theme/context'
import type { ThemedStyle } from '@/theme/types'
import type { ReportReason } from '@/types/report'

export interface ReportModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean
  /**
   * Called when modal should be closed
   */
  onClose: () => void
  /**
   * Called when report is submitted
   */
  onSubmit: (reason: ReportReason, description?: string) => void
  /**
   * Whether the form is currently submitting
   */
  isSubmitting: boolean
}

const REPORT_REASONS = [
  { key: 'inappropriate_content', labelTx: 'report:inappropriateContent' },
  { key: 'spam', labelTx: 'report:spam' },
  { key: 'misleading', labelTx: 'report:misleading' },
  { key: 'offensive', labelTx: 'report:offensive' },
  { key: 'other', labelTx: 'report:other' },
] as const

export const ReportModal = observer(function ReportModal(props: ReportModalProps) {
  const { visible, onClose, onSubmit, isSubmitting } = props
  const { themed } = useAppTheme()
  
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('')
  const [description, setDescription] = useState('')

  const handleSubmit = () => {
    if (!selectedReason) return
    
    // Validate "other" reason requires description
    if (selectedReason === 'other') {
      const trimmedDescription = description.trim()
      if (!trimmedDescription || trimmedDescription.length < 10) {
        // Could show alert or inline error - for now, just return
        return
      }
    }
    
    onSubmit(selectedReason, description.trim() || undefined)
    
    // Reset form
    setSelectedReason('')
    setDescription('')
  }

  const handleClose = () => {
    setSelectedReason('')
    setDescription('')
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      testID="report-modal"
    >
      <View style={themed($container)}>
        <View style={themed($header)}>
          <Text preset="heading" tx="report:title" />
          <TouchableOpacity 
            onPress={handleClose} 
            style={themed($closeButton)}
            accessibilityLabel="Close report modal"
            accessibilityRole="button"
          >
            <Text style={themed($closeText)}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={themed($content)} showsVerticalScrollIndicator={false}>
          <Text tx="report:selectReason" style={themed($subtitle)} />
          
          <View style={themed($reasonsList)}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.key}
                style={themed((theme) => ({
                  ...$reasonOption(theme),
                  ...(selectedReason === reason.key ? $reasonSelected(theme) : {}),
                }))}
                onPress={() => setSelectedReason(reason.key)}
                disabled={isSubmitting}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedReason === reason.key }}
                accessibilityLabel={`Select ${reason.key.replace('_', ' ')} as report reason`}
              >
                <View style={themed($radioContainer)}>
                  <View style={themed((theme) => ({
                    ...$radio(theme),
                    ...(selectedReason === reason.key ? $radioSelected(theme) : {}),
                  }))} />
                </View>
                <Text tx={reason.labelTx} style={themed($reasonText)} />
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'other' && (
            <View style={themed($descriptionContainer)}>
              <Text tx="report:descriptionLabel" style={themed($descriptionLabel)} />
              <TextField
                value={description}
                onChangeText={setDescription}
                placeholder="Please provide more details..."
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={!isSubmitting}
                style={themed($descriptionInput)}
              />
            </View>
          )}
        </ScrollView>

        <View style={themed($footer)}>
          <Button
            tx="common:cancel"
            preset="default"
            onPress={handleClose}
            disabled={isSubmitting}
            style={themed($cancelButton)}
          />
          <Button
            tx="report:submitReport"
            preset="filled"
            onPress={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            style={themed($submitButton)}
          />
        </View>
      </View>
    </Modal>
  )
})

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  backgroundColor: theme.colors.background,
})

const $header: ThemedStyle<ViewStyle> = (theme) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
  ...(Platform.OS === 'web'
    ? { boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)` }
    : {
        shadowColor: theme.colors.palette.neutral800,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }),
})

const $closeButton: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.xs,
})

const $closeText: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 20,
  color: theme.colors.textDim,
})

const $content: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  padding: theme.spacing.lg,
})

const $subtitle: ThemedStyle<TextStyle> = (theme) => ({
  marginBottom: theme.spacing.md,
  color: theme.colors.textDim,
})

const $reasonsList: ThemedStyle<ViewStyle> = (theme) => ({
  marginBottom: theme.spacing.lg,
})

const $reasonOption: ThemedStyle<ViewStyle> = (theme) => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: theme.spacing.sm,
  paddingHorizontal: theme.spacing.md,
  marginVertical: theme.spacing.xs,
  borderRadius: theme.spacing.sm,
  borderWidth: 1,
  borderColor: theme.colors.border,
})

const $reasonSelected: ThemedStyle<ViewStyle> = (theme) => ({
  borderColor: theme.colors.tint,
  backgroundColor: theme.colors.palette.primary100,
})

const $radioContainer: ThemedStyle<ViewStyle> = (theme) => ({
  marginRight: theme.spacing.sm,
})

const $radio: ThemedStyle<ViewStyle> = (theme) => ({
  width: 20,
  height: 20,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: theme.colors.border,
})

const $radioSelected: ThemedStyle<ViewStyle> = (theme) => ({
  borderColor: theme.colors.tint,
  backgroundColor: theme.colors.tint,
})

const $reasonText: ThemedStyle<TextStyle> = (theme) => ({
  flex: 1,
})

const $descriptionContainer: ThemedStyle<ViewStyle> = (theme) => ({
  marginTop: theme.spacing.md,
})

const $descriptionLabel: ThemedStyle<TextStyle> = (theme) => ({
  marginBottom: theme.spacing.sm,
  color: theme.colors.textDim,
})

const $descriptionInput: ThemedStyle<ViewStyle> = (theme) => ({
  minHeight: 80,
})

const $footer: ThemedStyle<ViewStyle> = (theme) => ({
  flexDirection: 'row',
  padding: theme.spacing.lg,
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
  gap: theme.spacing.sm,
})

const $cancelButton: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
})

const $submitButton: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
})