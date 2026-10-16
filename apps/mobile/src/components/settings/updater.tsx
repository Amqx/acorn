import Constants from 'expo-constants'
import { StyleSheet } from 'react-native-unistyles'

import { Pressable } from '~/components/common/pressable'
import { Text } from '~/components/common/text'
import { useLink } from '~/hooks/link'

const commit: unknown = Constants.expoConfig?.extra?.commit

export function Updater() {
  const { handleLink } = useLink()

  if (typeof commit !== 'string') {
    return null
  }

  return (
    <Pressable
      hitSlop={8}
      onPress={() => {
        handleLink(`https://github.com/amqx/acorn/commit/${commit}`)
      }}
      style={styles.main}
    >
      <Text highContrast={false} variant="mono">
        {commit.slice(0, 7)}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  main: {
    alignSelf: 'center',
  },
})
