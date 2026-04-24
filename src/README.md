/**
 * React Native Version - Export Directory
 *
 * This directory contains the React Native adaptation of the web application.
 * To use these files:
 *
 * 1. Create a new React Native project:
 *    npx react-native init UchileAyuda
 *
 * 2. Install dependencies:
 *    npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
 *    npm install react-native-screens react-native-safe-area-context
 *    npm install react-native-reanimated react-native-gesture-handler
 *    npm install react-native-vector-icons
 *    npm install axios
 *    npm install date-fns
 *
 * 3. For iOS:
 *    cd ios && pod install && cd ..
 *
 * 4. Copy files from this directory to your React Native project:
 *    - Copy src/services/* to your RN project
 *    - Copy react-native/* to appropriate locations in your RN project
 *
 * 5. Update babel.config.js to include react-native-reanimated plugin
 *
 * 6. Update your .env file with Laravel API URL:
 *    REACT_APP_API_URL=https://ayuda.uchile.cl/api
 */

// File structure for React Native project:
/*
UchileAyuda/
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── RequestsListScreen.tsx
│   │   ├── RequestDetailScreen.tsx
│   │   ├── CreateRequestScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── AdminScreen.tsx
│   ├── components/
│   │   ├── MetricCard.tsx
│   │   ├── RequestCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── SLAIndicator.tsx
│   │   └── CommentItem.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── hooks.ts
│   ├── styles/
│   │   ├── colors.ts
│   │   └── spacing.ts
│   └── App.tsx
├── android/
├── ios/
└── package.json
*/

export {};
