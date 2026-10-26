import React, { Component } from 'react';
import { Pressable, Text, View } from 'react-native';

/** A failed report render must never replace or clear the stored journal. */
export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed)
      return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: 18,
          padding: 28,
          backgroundColor: '#19382D',
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ color: '#F5F9ED', fontSize: 26, fontWeight: '700' }}
        >
          Let’s reopen your journal
        </Text>
        <Text style={{ color: '#DFEADB', fontSize: 16, lineHeight: 24 }}>
          This screen could not be displayed. Your saved records are still on this phone.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState((state) => ({ failed: false, attempt: state.attempt + 1 }))}
          style={{
            minHeight: 48,
            padding: 16,
            borderRadius: 16,
            backgroundColor: '#C6F36B',
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ color: '#18301E', fontWeight: '700' }}>Return to Home</Text>
        </Pressable>
      </View>
    );
  }
}
