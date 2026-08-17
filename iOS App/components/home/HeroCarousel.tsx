import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import Theme from '../../theme';

const ChevronLeftSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`}
    width={22}
    height={22}
  />
);

const ChevronRightSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`}
    width={22}
    height={22}
  />
);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - 2 * Theme.spacing.md;
const CAROUSEL_HEIGHT = (CAROUSEL_WIDTH * 800) / 1600;

const slides = [
  require('../../assets/hero/1.png'),
  require('../../assets/hero/2.png'),
  require('../../assets/hero/3.png'),
  require('../../assets/hero/4.png'),
  require('../../assets/hero/5.png'),
];

export default function HeroCarousel() {
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    const next = (index + slides.length) % slides.length;
    scrollRef.current?.scrollTo({ x: next * CAROUSEL_WIDTH, animated: true });
    setCurrent(next);
  }, []);

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(goNext, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, goNext]);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
      setCurrent(page);
    },
    [],
  );

  return (
    <View
      style={styles.container}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
      >
        {slides.map((src, i) => (
          <Image key={i} source={src} style={styles.slide} resizeMode="cover" />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.arrowLeft}
        onPress={goPrev}
        activeOpacity={0.7}
        accessibilityLabel="Previous slide"
      >
        <ChevronLeftSvg />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.arrowRight}
        onPress={goNext}
        activeOpacity={0.7}
        accessibilityLabel="Next slide"
      >
        <ChevronRightSvg />
      </TouchableOpacity>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goTo(i)}
            style={[styles.dot, i === current && styles.dotActive]}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    borderRadius: Theme.borderRadii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  slide: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: Theme.borderRadii.xl,
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
    borderRadius: 4,
  },
  arrowLeft: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: 36,
    height: 52,
    marginTop: -26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopRightRadius: Theme.borderRadii.md,
    borderBottomRightRadius: Theme.borderRadii.md,
  },
  arrowRight: {
    position: 'absolute',
    right: 0,
    top: '50%',
    width: 36,
    height: 52,
    marginTop: -26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopLeftRadius: Theme.borderRadii.md,
    borderBottomLeftRadius: Theme.borderRadii.md,
  },
});
