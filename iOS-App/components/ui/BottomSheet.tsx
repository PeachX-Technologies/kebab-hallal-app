import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Theme from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.92;
const DISMISS_THRESHOLD = 80;
const CLOSE_TRANSLATE_Y = SCREEN_HEIGHT;
const CLOSE_DURATION = 300;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const [renderSheet, setRenderSheet] = useState(visible);
  const translateY = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRenderSheet(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 3,
          speed: 14,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: CLOSE_TRANSLATE_Y,
          duration: CLOSE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setRenderSheet(false));
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 2,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={renderSheet}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Close">
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity, backgroundColor: colors.overlay }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.topAccent, { backgroundColor: colors.primary }]} />

        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SHEET_MAX_HEIGHT,
    borderTopLeftRadius: Theme.borderRadii.xl,
    borderTopRightRadius: Theme.borderRadii.xl,
    ...Theme.shadows.lg,
    overflow: 'hidden',
  },
  topAccent: {
    height: 4,
    borderTopLeftRadius: Theme.borderRadii.xxl,
    borderTopRightRadius: Theme.borderRadii.xxl,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: Theme.borderRadii.full,
  },
});
