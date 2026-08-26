import { useRecyclingState } from '@shopify/flash-list'
import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import {
  useEvent,
  useVideoPlayer,
  VideoView,
  type VideoViewRef,
} from 'react-native-video'
import { useTranslations } from 'use-intl'
import { useShallow } from 'zustand/react/shallow'

import { Icon } from '~/components/common/icon'
import { useInView } from '~/components/common/in-view'
import { MediaMenu } from '~/components/common/media-menu'
import { Pressable } from '~/components/common/pressable'
import { Spinner } from '~/components/common/spinner'
import { useHistory } from '~/hooks/history'
import { usePreferences } from '~/stores/preferences'
import { space } from '~/styles/tokens'
import { type PostMedia } from '~/types/post'

import { GalleryBlur } from '../gallery/blur'
import { VideoStatus } from './status'

type Props = {
  compact?: boolean
  crossPost?: boolean
  large?: boolean
  nsfw?: boolean
  recyclingKey: string
  spoiler?: boolean
  video: PostMedia
}

export function VideoPlayer({
  compact = false,
  crossPost = false,
  large = false,
  nsfw,
  recyclingKey,
  spoiler,
  video,
}: Props) {
  const t = useTranslations('component.posts.video')
  const a11y = useTranslations('a11y')

  const {
    autoPlay,
    blurNsfw,
    blurSpoiler,
    feedMuted,
    pictureInPicture,
    seenOnMedia,
    unmuteFullscreen,
  } = usePreferences(
    useShallow((state) => ({
      autoPlay: state.autoPlay,
      blurNsfw: state.blurNsfw,
      blurSpoiler: state.blurSpoiler,
      feedMuted: state.feedMuted,
      pictureInPicture: state.pictureInPicture,
      seenOnMedia: state.seenOnMedia,
      unmuteFullscreen: state.unmuteFullscreen,
    })),
  )

  const { addPost } = useHistory()

  styles.useVariants({
    compact,
    crossPost,
    large,
  })

  const view = useRef<VideoViewRef>(null)

  const player = useVideoPlayer(video.url, (instance) => {
    instance.mixAudioMode = 'mixWithOthers'
    instance.loop = true
    instance.muted = feedMuted
  })

  const [loaded, setLoaded] = useRecyclingState(false, [recyclingKey])
  const [duration, setDuration] = useRecyclingState(0, [recyclingKey])
  const [muted, setMuted] = useRecyclingState(feedMuted, [recyclingKey])
  const [fullscreen, setFullscreen] = useRecyclingState(false, [recyclingKey])

  useEvent(player, 'onLoad', (event) => {
    setLoaded(true)
    setDuration(event.duration)
  })

  useEvent(player, 'onVolumeChange', (event) => {
    setMuted(event.muted)
  })

  const inView = useInView(recyclingKey)

  useEffect(() => {
    if (!compact && inView && autoPlay) {
      player.play()
    } else {
      player.pause()
    }
  }, [autoPlay, compact, player, inView])

  return (
    <Pressable
      accessibilityLabel={a11y('viewVideo')}
      onLongPress={() => {
        MediaMenu.call({
          type: 'video',
          url: video.url,
        })
      }}
      onPress={() => {
        view.current?.enterFullscreen()

        if (recyclingKey && seenOnMedia) {
          addPost({
            id: recyclingKey,
          })
        }
      }}
      style={styles.main}
      variant="plain"
    >
      <VideoView
        autoEnterPictureInPicture={pictureInPicture}
        controls={fullscreen}
        onFullscreenChange={(next) => {
          setFullscreen(next)

          if (!(next || compact) && autoPlay) {
            player.play()
          }
        }}
        pictureInPicture={pictureInPicture}
        player={player}
        pointerEvents="none"
        ref={view}
        style={styles.video(video.width / video.height)}
        willEnterFullscreen={() => {
          player.play()

          if (unmuteFullscreen && muted) {
            player.muted = false
          }
        }}
        willExitFullscreen={() => {
          if (compact || !autoPlay) {
            player.pause()
          }

          if (feedMuted) {
            player.muted = true
          }
        }}
      />

      {compact ? null : <VideoStatus duration={duration} player={player} />}

      {loaded ? null : (
        <View style={styles.loading}>
          <Spinner />
        </View>
      )}

      {compact ? (
        <View style={styles.compact}>
          <Icon name="play-fill" />

          {(nsfw && blurNsfw) || (spoiler && blurSpoiler) ? (
            <GalleryBlur compact />
          ) : null}
        </View>
      ) : (nsfw && blurNsfw) || (spoiler && blurSpoiler) ? (
        <GalleryBlur label={t(spoiler ? 'spoiler' : 'nsfw')} />
      ) : (
        <Pressable
          accessibilityLabel={a11y(muted ? 'unmute' : 'mute')}
          hitSlop={space[3]}
          onPress={() => {
            setMuted((previous) => !previous)
          }}
          style={styles.volume}
        >
          <Icon
            name={muted ? 'speaker-x' : 'speaker-high'}
            uniProps={(theme) => ({
              color: theme.colors.gray.contrast,
              size: theme.space[4],
            })}
          />
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create((theme, runtime) => ({
  compact: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: theme.colors.black.accentAlpha,
    justifyContent: 'center',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  volume: {
    backgroundColor: theme.colors.black.accentAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.space[4],
    bottom: theme.space[3],
    padding: theme.space[2],
    position: 'absolute',
    right: theme.space[2],
  },
}))
