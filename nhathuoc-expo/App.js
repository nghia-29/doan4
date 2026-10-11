import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import ProductsScreen from './screens/ProductsScreen';
import PromotionsScreen from './screens/PromotionsScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import CartScreen from './screens/CartScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import CustomerScreen from './screens/CustomerScreen';
import StaffScreen from './screens/StaffScreen';
import InfoScreen from './screens/InfoScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminCrudScreen from './screens/AdminCrudScreen';
import AdminOrderDetailScreen from './screens/AdminOrderDetailScreen';
import AdminReceiptDetailScreen from './screens/AdminReceiptDetailScreen';
import AdminPrescriptionDetailScreen from './screens/AdminPrescriptionDetailScreen';
import PrescriptionRequestDetailScreen from './screens/PrescriptionRequestDetailScreen';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

const Stack = createNativeStackNavigator();

const linking = {
  config: {
    screens: {
      Home: '',
      Products: 'products',
      Promotions: 'promotions',
      ProductDetail: 'products/:id',
      Cart: 'cart',
      Login: 'login',
      Register: 'register',
      Customer: 'account',
      Staff: 'staff/:tab?',
      About: 'about',
      Quality: 'quality',
      Contact: 'contact',
      AdminDashboard: 'admin',
      AdminCrud: 'admin/:entity',
      AdminOrderDetail: 'admin/orders/:id',
      AdminReceiptDetail: 'admin/receipts/:id',
      AdminPrescriptionDetail: 'staff/prescriptions/:id',
      PrescriptionRequestDetail: 'staff/prescription-requests/:id',
    },
  },
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer linking={linking}>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#f5f7fb' },
              gestureEnabled: true,
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Products" component={ProductsScreen} />
            <Stack.Screen name="Promotions" component={PromotionsScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Customer" component={CustomerScreen} />
            <Stack.Screen name="Staff" component={StaffScreen} />
            <Stack.Screen name="About" component={InfoScreen} initialParams={{ type: 'about' }} />
            <Stack.Screen name="Quality" component={InfoScreen} initialParams={{ type: 'quality' }} />
            <Stack.Screen name="Contact" component={InfoScreen} initialParams={{ type: 'contact' }} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminCrud" component={AdminCrudScreen} />
            <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
            <Stack.Screen name="AdminReceiptDetail" component={AdminReceiptDetailScreen} />
            <Stack.Screen name="AdminPrescriptionDetail" component={AdminPrescriptionDetailScreen} />
            <Stack.Screen name="PrescriptionRequestDetail" component={PrescriptionRequestDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}
