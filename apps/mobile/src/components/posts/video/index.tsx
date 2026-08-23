import { MediaMenu } from '~/components/common/media-menu'
// import { useFocused } from '~/hooks/focus'
import { type PostMedia } from '~/types/post'

import { PostLinkCard } from '../link'
// import { VideoPlaceholder } from './placeholder'
import { VideoPlayer } from './player'
import { RedGifsVideo } from './red-gifs'

type Props = {
  compact?: boolean
  crossPost?: boolean
  inView: boolean
  large?: boolean
  nsfw?: boolean
  recyclingKey?: string
  spoiler?: boolean
  thumbnail?: string
  video: PostMedia
}

export function PostVideoCard({
  compact,
  crossPost,
  inView,
  large,
  nsfw,
  recyclingKey,
  spoiler,
  // thumbnail,
  video,
}: Props) {
  // const { focused } = useFocused()

  // if (!focused) {
  //   return (
  //     <VideoPlaceholder
  //       compact={compact}
  //       crossPost={crossPost}
  //       large={large}
  //       nsfw={nsfw}
  //       recyclingKey={recyclingKey}
  //       spoiler={spoiler}
  //       thumbnail={thumbnail}
  //       video={video}
  //     />
  //   )
  // }

  if (video.provider === 'red-gifs') {
    return (
      <RedGifsVideo
        compact={compact}
        crossPost={crossPost}
        inView={inView}
        large={large}
        nsfw={nsfw}
        recyclingKey={recyclingKey}
        spoiler={spoiler}
        video={video}
      />
    )
  }

  if (video.provider === 'reddit') {
    return (
      <VideoPlayer
        compact={compact}
        crossPost={crossPost}
        inView={inView}
        large={large}
        nsfw={nsfw}
        recyclingKey={recyclingKey}
        spoiler={spoiler}
        video={video}
      />
    )
  }

  const media = video.thumbnail
    ? {
        ...video,
        url: video.thumbnail,
      }
    : undefined

  return (
    <PostLinkCard
      compact={compact}
      crossPost={crossPost}
      large={large}
      media={media}
      onLongPress={() => {
        MediaMenu.call({
          type: 'link',
          url: video.url,
        })
      }}
      recyclingKey={recyclingKey}
      url={video.url}
    />
  )
}
