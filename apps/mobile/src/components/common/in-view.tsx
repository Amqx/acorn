import { maxBy, range } from 'lodash'
import { create } from 'mutative'
import { type ReactNode, useEffect, useRef } from 'react'
import { View } from 'react-native'
import { create as createStore } from 'zustand'

type Props = {
  children: ReactNode
  id: string
  onChange: (visible: boolean) => void
}

export function InView({ children, id, onChange }: Props) {
  const ref = useRef<View>(null)

  const { inView, set, unset } = useInView()

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

  useEffect(() => {
    const visible = maxBy(inView, 'ratio')

    onChange(visible?.id === id && visible.ratio > 0.4)
  }, [id, inView, onChange])

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

const useInView = createStore<State>()((set) => ({
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
