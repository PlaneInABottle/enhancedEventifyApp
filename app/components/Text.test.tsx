import { renderWithProviders, setupComponentTest } from "../../test/helpers/componentTestHelpers"
import { Text } from "./Text"

/* This is an example component test using react-native-testing-library. For more
 * information on how to write your own, see the documentation here:
 * https://callstack.github.io/react-native-testing-library/ */
const testText = "Test string"

describe("Text", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const renderText = (props = {}) => {
    const defaultProps = {
      text: testText,
    }
    return renderWithProviders(
      <Text {...defaultProps} {...props} />,
      { withNavigation: true, withStoreProvider: false }
    )
  }

  it("should render the component", () => {
    const { getByText } = renderText()
    expect(getByText(testText)).toBeDefined()
  })
})
