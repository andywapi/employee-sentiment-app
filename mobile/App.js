import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserSurveyScreen from './screens/UserSurveyScreen';
import AdminSurveyScreen from './screens/AdminSurveyScreen';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen 
          name="User Survey" 
          component={UserSurveyScreen} 
        />
        <Tab.Screen 
          name="Admin Survey" 
          component={AdminSurveyScreen} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
