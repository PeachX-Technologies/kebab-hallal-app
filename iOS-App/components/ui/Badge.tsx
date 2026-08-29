import { StyleSheet, Text, View } from 'react-native';
import Theme from '../../theme';

interface BadgeProps {
  count: number;
}

export default function Badge({ count }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge} accessibilityLabel={`${count} items in cart`}>
      <Text style={styles.text}>{count > 99 ? '99+' : String(count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Theme.colors.badge,
    borderRadius: Theme.borderRadii.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: Theme.colors.badgeText,
    fontSize: 11,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
});
