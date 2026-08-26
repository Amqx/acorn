import { maxBy, range } from 'lodash'
import { create } from 'mutative'
import { type ReactNode, useEffect, useRef } from 'react'
import { View } from 'react-native'
import { create as createStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

type Props = {
  children: ReactNode
  id: string
}

export function InView({ children, id }: Props) {
  const ref = useRef<View>(null)

  const { set, unset } = useStore()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          set(id, entry.intersectionRatio)
        } else {
          unset(id)
        }
      },
      {
        threshold: range(11).map((index) => index / 10),
      },
    )

    if (ref.current) {
      observer.observe(ref.current as unknown as Element)
    }

    return () => {
      observer.disconnect()
    }
  }, [id, set, unset])

  return (
    <View collapsable={false} ref={ref}>
      {children}
    </View>
  )
}

type State = {
  inView: Array<{
    id: string
    ratio: number
  }>
  set: (id: string, ratio: number) => void
  unset: (id: string) => void
}

const useStore = createStore<State>()((set) => ({
  inView: [],
  set(id, ratio) {
    set((state) => ({
      inView: create(state.inView, (draft) => {
        const exists = draft.find((item) => item.id === id)

        if (exists) {
          exists.ratio = ratio
        } else {
          draft.push({
            id,
            ratio,
          })
        }
      }),
    }))
  },
  unset(id) {
    set((state) => ({
      inView: state.inView.filter((item) => item.id !== id),
    }))
  },
}))

export function useInView(id: string) {
  const inView = useStore(useShallow((state) => state.inView))

  const visible = maxBy(inView, 'ratio')

  return visible?.id === id && visible.ratio > 0.4
}
