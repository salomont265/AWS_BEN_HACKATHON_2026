import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/theme/tokens';

const { width, height } = Dimensions.get('window');

export default function FloatingLeaves() {
  const leaf1Y = useRef(new Animated.Value(-30)).current;
  const leaf2Y = useRef(new Animated.Value(-30)).current;
  const leaf3Y = useRef(new Animated.Value(-30)).current;

  const leaf1Opacity = useRef(new Animated.Value(0)).current;
  const leaf2Opacity = useRef(new Animated.Value(0)).current;
  const leaf3Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (yValue: Animated.Value, opacityValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(yValue, {
              toValue: height + 30,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacityValue, {
                toValue: 0.25,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(opacityValue, {
                toValue: 0,
                duration: 1000,
                delay: 7000,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(yValue, {
            toValue: -30,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createAnimation(leaf1Y, leaf1Opacity, 0);
    const anim2 = createAnimation(leaf2Y, leaf2Opacity, 3000);
    const anim3 = createAnimation(leaf3Y, leaf3Opacity, 6000);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const leaves = [
    { y: leaf1Y, opacity: leaf1Opacity, x: width * 0.2 },
    { y: leaf2Y, opacity: leaf2Opacity, x: width * 0.6 },
    { y: leaf3Y, opacity: leaf3Opacity, x: width * 0.8 },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {leaves.map((leaf, i) => (
        <Animated.View
          key={i}
          style={[
            styles.leaf,
            {
              left: leaf.x,
              transform: [{ translateY: leaf.y }],
              opacity: leaf.opacity,
            },
          ]}
        >
          <View style={styles.leafShape} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  leaf: {
    position: 'absolute',
    width: 16,
    height: 16,
  },
  leafShape: {
    width: 60,
    height: 60,
    backgroundColor: '#FF0000', // HUGE RED SQUARES - VERY OBVIOUS
    borderRadius: 30,
  },
});
