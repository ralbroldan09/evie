import React from 'react';
import { StatusBar } from 'react-native';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import HomeScreen from './src/screens/HomeScreen';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#1A1A1A" 
        translucent={false}
      />
      <HomeScreen />
    </ErrorBoundary>
  );
};

export default App;