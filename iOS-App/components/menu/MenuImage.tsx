import { useState } from 'react';
import { ImageStyle, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { getMenuImageSource } from '../../lib/menuImages';

interface MenuImageProps {
  filename?: string | null;
  style?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  fallback?: React.ReactNode;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  fadeDuration?: number;
}

const contentFitMap: Record<string, 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  repeat: 'none',
  center: 'none',
};

export default function MenuImage({
  filename,
  style,
  placeholderStyle,
  fallback,
  resizeMode = 'cover',
}: MenuImageProps) {
  const [failed, setFailed] = useState(false);

  const source = filename ? getMenuImageSource(filename) : undefined;

  if (failed || !source) {
    if (!source && filename) {
      console.warn(`[MenuImage] No source for "${filename}"`);
    }
    if (failed && filename) {
      console.warn(`[MenuImage] Image load failed for "${filename}"`);
    }
    return (
      <View
        style={[
          { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8e8e8' },
          style,
          placeholderStyle,
        ]}
      >
        {fallback ?? <Text style={{ fontSize: 24 }}>🥙</Text>}
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFitMap[resizeMode] ?? 'cover'}
      transition={200}
      onError={() => setFailed(true)}
    />
  );
}
