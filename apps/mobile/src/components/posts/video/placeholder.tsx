import { Image } from 'expo-image'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useTranslations } from 'use-intl'
import { useShallow } from 'zustand/react/shallow'

import { usePreferences } from '~/stores/preferences'
import { type PostMedia } from '~/types/post'

import { GalleryBlur } from '../gallery/blur'

type Props = {
  compact?: boolean
  crossPost?: boolean
  large?: boolean
  nsfw?: boolean
  recyclingKey?: string
  spoiler?: boolean
  thumbnail?: string
  video: PostMedia
}

export function VideoPlaceholder({
  compact = false,
  crossPost = false,
  large = false,
  nsfw,
  recyclingKey,
  spoiler,
  thumbnail,
  video,
}: Props) {
  const t = useTranslations('component.posts.video')

  styles.useVariants({
    compact,
    crossPost,
    large,
  })

  const { blurNsfw, blurSpoiler } = usePreferences(
    useShallow((state) => ({
      blurNsfw: state.blurNsfw,
      blurSpoiler: state.blurSpoiler,
    })),
  )

  return (
    <View style={styles.main}>
      <Image
        recyclingKey={recyclingKey}
        source={video.thumbnail ?? thumbnail}
        style={styles.image(video.width / video.height)}
      />

      {(nsfw && blurNsfw) || (spoiler && blurSpoiler) ? (
        <GalleryBlur
          compact={compact}
          label={t(spoiler ? 'spoiler' : 'nsfw')}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme, runtime) => ({
  image: (aspectRatio: number) => ({
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
}))
