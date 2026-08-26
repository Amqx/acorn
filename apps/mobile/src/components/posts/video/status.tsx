import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'
import { useEvent, type VideoPlayer } from 'react-native-video'

const config = {
  duration: 500,
  easing: Easing.linear,
} as const

type Props = {
  duration: number
  player: VideoPlayer
}

export function VideoStatus({ duration, player }: Props) {
  const current = useSharedValue(0)
  const buffered = useSharedValue(0)

  const currentStyle = useAnimatedStyle(() => ({
    width: `${(current.get() / duration) * 100 || 0}%`,
  }))

  const bufferedStyle = useAnimatedStyle(() => ({
    width: `${(buffered.get() / duration) * 100 || 0}%`,
  }))

  useEvent(player, 'onProgress', (event) => {
    current.set(withTiming(event.currentTime, config))
    buffered.set(withTiming(event.bufferDuration, config))
  })

  return (
    <View style={styles.main}>
      <Animated.View style={[styles.bar, styles.buffered, bufferedStyle]} />

      <Animated.View style={[styles.bar, styles.current, currentStyle]} />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    borderCurve: 'continuous',
    borderRadius: theme.space[1],
    bottom: 0,
    height: theme.space[1],
    left: 0,
    position: 'absolute',
    right: 0,
  },
  buffered: {
    backgroundColor: theme.colors.accent.uiAlpha,
  },
  current: {
    backgroundColor: theme.colors.accent.accent,
  },
  main: {
    backgroundColor: theme.colors.gray.uiAlpha,
    bottom: 0,
    left: -theme.space[1],
    position: 'absolute',
    right: -theme.space[1],
  },
}))
