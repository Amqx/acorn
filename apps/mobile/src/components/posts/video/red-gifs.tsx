import { View } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { StyleSheet } from 'react-native-unistyles'

import { Spinner } from '~/components/common/spinner'
import { useFocused } from '~/hooks/focus'
import { useRedGifs } from '~/hooks/red-gifs'
import { type PostMedia } from '~/types/post'

import { VideoPlaceholder } from './placeholder'
import { VideoPlayer } from './player'

type Props = {
  compact?: boolean
  crossPost?: boolean
  large?: boolean
  nsfw?: boolean
  recyclingKey: string
  spoiler?: boolean
  video: PostMedia
  viewing?: SharedValue<string | null>
}

export function RedGifsVideo({
  compact = false,
  crossPost = false,
  large = false,
  nsfw,
  recyclingKey,
  spoiler,
  video,
  viewing,
}: Props) {
  const { focused } = useFocused()

  styles.useVariants({
    compact,
    crossPost,
    large,
  })

  const { gif } = useRedGifs(video.url)

  if (!focused) {
    return (
      <VideoPlaceholder
        compact={compact}
        crossPost={crossPost}
        large={large}
        nsfw={nsfw}
        recyclingKey={recyclingKey}
        spoiler={spoiler}
        video={video}
      />
    )
  }

  if (gif) {
    return (
      <VideoPlayer
        compact={compact}
        crossPost={crossPost}
        large={large}
        nsfw={nsfw}
        recyclingKey={recyclingKey}
        spoiler={spoiler}
        video={{
          ...video,
          url: gif.url,
        }}
        viewing={viewing}
      />
    )
  }

  return (
    <View style={styles.main}>
      <View style={styles.video(video.width / video.height)}>
        <Spinner />
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme, runtime) => ({
  main: {
    borderCurve: 'continuous',
    borderRadius: theme.radius[4],
    compoundVariants: [
      {
        compact: false,
        crossPost: false,
        styles: {
          marginHorizontal: -theme.space[3],
        },
      },
      {
        compact: true,
        large: true,
        styles: {
          borderRadius: theme.space[1] * 2,
          height: theme.space[8] * 2,
          width: theme.space[8] * 2,
        },
      },
      {
        compact: true,
        large: false,
        styles: {
          borderRadius: theme.space[1],
          height: theme.space[8],
          width: theme.space[8],
        },
      },
    ],
    justifyContent: 'center',
    maxHeight: runtime.screen.height * 0.4,
    overflow: 'hidden',
    variants: {
      compact: {
        true: {},
      },
      crossPost: {
        true: {},
      },
      large: {
        true: {},
      },
    },
  },
  video: (aspectRatio: number) => ({
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      compact: {
        false: {
          aspectRatio,
        },
        true: {
          aspectRatio: 1,
        },
      },
    },
  }),
}))
