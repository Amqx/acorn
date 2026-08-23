import { type StyleProp, View, type ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

import { glass } from '~/lib/common'

import { GlassView } from '../native/glass-view'
import { Pressable } from './pressable'
import { Text } from './text'

type Props = {
  items: Array<{
    key: string
    label: string
  }>
  onChange: (key: string) => void
  style?: StyleProp<ViewStyle>
  value?: string
}

export function SegmentedControl({ items, onChange, style, value }: Props) {
  const Component = glass ? GlassView : View

  return (
    <Component isInteractive style={[styles.main, style]}>
      {items.map((item) => (
        <Pressable
          accessibilityLabel={item.label}
          key={item.key}
          onPress={() => {
            onChange(item.key)
          }}
          style={styles.item(item.key === value)}
        >
          <Text
            contrast={value === item.key}
            key={item.key}
            size="2"
            weight="medium"
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </Component>
  )
}

const styles = StyleSheet.create((theme) => ({
  item: (selected: boolean) => ({
    alignItems: 'center',
    backgroundColor: selected ? theme.colors.accent.accent : undefined,
    borderCurve: 'continuous',
    borderRadius: theme.space[7],
    flex: 1,
    height: theme.space[6],
    justifyContent: 'center',
  }),
  main: {
    backgroundColor: glass ? undefined : theme.colors.gray.uiActive,
    borderCurve: 'continuous',
    borderRadius: theme.space[7],
    flexDirection: 'row',
    overflow: 'hidden',
    padding: theme.space[1],
  },
}))
