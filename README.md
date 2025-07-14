# Deal Me Up

Deal Me Up is a React Native (Expo) app for discovering and sharing the best deals from around the web. It features user authentication, deal listings, favorites, and user-posted deals, all powered by Firebase.

## Features
- Browse deals from public RSS feeds (e.g., TechBargains)
- User authentication (email/password via Firebase Auth)
- User profile page (account info, favorites, posted deals)
- Save favorite deals
- Post your own deals (future feature)
- Custom navigation and modern UI

## Technologies Used
- **React Native** (with Expo)
- **Firebase** (Auth, Firestore/Realtime Database)
- **Expo AuthSession** (for Google Auth, optional)
- **React Navigation**
- **RSS Parsing** for deal feeds

## Setup
1. Clone the repo:
   ```sh
   git clone https://github.com/<your-username>/deal_me_up.git
   cd deal_me_up
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Add your Firebase config to `lib/firebase.ts`.
4. Start the app:
   ```sh
   npx expo start
   ```

## Usage
- Sign up or log in with email/password.
- Browse deals on the Offerings page.
- Save favorites and view your profile on the User page.
- (Optional) Set up Google Auth by following the Expo and Firebase docs.

## Notes
- Google Auth may not work in Expo Go due to redirect URI limitations.
- AsyncStorage is optional for auth persistence.
- This app is for demo/development purposes and not intended for production use.

## License
MIT
