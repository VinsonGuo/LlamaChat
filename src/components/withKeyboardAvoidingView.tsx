import React from 'react';
import {KeyboardAvoidingView, Platform, StyleSheet} from 'react-native';

const withKeyboardAvoidingView = (WrappedComponent: any) => {
  return (props: any) => (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 68 : 0}
    >
      <WrappedComponent {...props} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default withKeyboardAvoidingView;
