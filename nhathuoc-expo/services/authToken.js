import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'nhathuoc_access_token';

export function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  return token
    ? AsyncStorage.setItem(ACCESS_TOKEN_KEY, token)
    : AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
}
