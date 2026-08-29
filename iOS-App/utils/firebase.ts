import { Platform } from 'react-native';

let authInstance: any;
let AuthTypes: any;

try {
  require('@react-native-firebase/app');
  const authModule = require('@react-native-firebase/auth');
  authInstance = authModule.default;
  AuthTypes = authModule.FirebaseAuthTypes;
} catch (e) {
  console.warn('RNFBAppModule not found. Using mock auth. Development client required for Firebase.');

  AuthTypes = {
    User: class {},
    PhoneAuthProvider: class {},
    PhoneAuthState: {},
  };

  authInstance = () => ({
    onAuthStateChanged: () => () => {},
    signOut: async () => {},
    signInWithPhoneNumber: async () => {
      throw new Error('Firebase native module missing. Use a development client.');
    },
  });
}

export { AuthTypes as FirebaseAuthTypes };
export const auth = authInstance;
export default authInstance;
