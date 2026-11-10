export const environment = {
  production: true,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'micro-learning-app-prod.firebaseapp.com',
    projectId: 'micro-learning-app-prod',
    storageBucket: 'micro-learning-app-prod.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  },
  quiz: {
    durationSeconds: 120,
    xpPerCorrectAnswer: 10,
    xpBonusPerfectRun: 25
  }
};
