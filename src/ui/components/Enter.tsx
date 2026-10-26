import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
export function Enter({ children, delay = 0, style }: ViewProps & { delay?: number }) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 420, delay, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [delay, reduced, progress]);
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>{children}</Animated.View>;
}
