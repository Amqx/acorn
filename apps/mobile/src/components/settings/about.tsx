import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useTranslations } from 'use-intl'

import { Logo } from '~/components/common/logo'
import { Text } from '~/components/common/text'

export function AboutCard() {
  const t = useTranslations('screen.settings.about')

  return (
    <View style={styles.main}>
      <View style={styles.content}>
        <Logo />

        <Text mt="4" size="8" style={styles.title} weight="bold">
          {t('header.title')}
        </Text>

        <Text highContrast={false} mt="2" size="2" weight="medium">
          {t('header.description')}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  content: {
    alignItems: 'center',
  },
  main: {
    alignItems: 'center',
    gap: theme.space[6],
    paddingHorizontal: theme.space[4],
  },
  title: {
    color: theme.colors.accent.accent,
  },
}))
