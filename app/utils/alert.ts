import { Alert as RNAlert, Platform } from "react-native"

import { translate } from "@/i18n/translate"

export interface AlertButton {
  text?: string
  onPress?: () => void
  style?: "default" | "cancel" | "destructive"
}

export interface AlertOptions {
  cancelable?: boolean
  onDismiss?: () => void
}

/**
 * Cross-platform alert utility that works on both mobile and web
 */
class AlertManager {
  /**
   * Shows an alert dialog
   * @param title - The dialog title
   * @param message - The dialog message (optional)
   * @param buttons - Array of buttons (optional)
   * @param options - Alert options (optional)
   */
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions): void {
    if (Platform.OS === "web") {
      // Web implementation using browser's confirm/alert
      this.webAlert(title, message, buttons, options)
    } else {
      // Mobile implementation using React Native Alert
      RNAlert.alert(title, message, buttons, options)
    }
  }

  private webAlert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ): void {
    const fullMessage = message ? `${title}\n\n${message}` : title

    if (!buttons || buttons.length === 0) {
      // Simple alert with OK button
      window.alert(fullMessage)
      return
    }

    if (buttons.length === 1) {
      // Single button alert
      window.alert(fullMessage)
      const button = buttons[0]
      if (button.onPress) {
        button.onPress()
      }
      return
    }

    // Multiple buttons - use confirm dialog for simple yes/no scenarios
    if (buttons.length === 2) {
      const confirmButton = buttons.find((b) => b.style !== "cancel")
      const cancelButton = buttons.find((b) => b.style === "cancel")

      if (window.confirm(fullMessage)) {
        if (confirmButton?.onPress) {
          confirmButton.onPress()
        }
      } else {
        if (cancelButton?.onPress) {
          cancelButton.onPress()
        }
        if (options?.onDismiss) {
          options.onDismiss()
        }
      }
      return
    }

    // For more than 2 buttons, fall back to a simple prompt
    // This is a limitation of web browsers
    const buttonTexts = buttons
      .map((b, i) => `${i + 1}. ${b.text || translate("common:ok")}`)
      .join("\n")
    const choice = window.prompt(
      `${fullMessage}\n\n${translate("common:chooseOption")}:\n${buttonTexts}`,
    )

    if (choice) {
      const index = parseInt(choice) - 1
      if (index >= 0 && index < buttons.length && buttons[index].onPress) {
        buttons[index].onPress()
      }
    } else if (options?.onDismiss) {
      options.onDismiss()
    }
  }

  /**
   * Shows a simple alert with an OK button
   * @param title - The dialog title
   * @param message - The dialog message (optional)
   */
  simple(title: string, message?: string): void {
    this.alert(title, message)
  }

  /**
   * Shows a confirmation dialog with OK and Cancel buttons
   * @param title - The dialog title
   * @param message - The dialog message (optional)
   * @param onConfirm - Callback when user confirms
   * @param onCancel - Callback when user cancels (optional)
   */
  confirm(title: string, message?: string, onConfirm?: () => void, onCancel?: () => void): void {
    this.alert(title, message, [
      {
        text: translate("common:cancel"),
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: translate("common:ok"),
        onPress: onConfirm,
      },
    ])
  }
}

// Export singleton instance
export const Alert = new AlertManager()
