# Finance Keeper 📊

A modern React Native mobile application for tracking personal finances and managing credit/debit transactions with a clean, intuitive interface.

## ✨ Features

-   **User Management**: Create, edit, and delete user accounts
-   **Transaction Tracking**: Record debit and credit transactions with remarks
-   **Balance Calculation**: Automatic balance updates based on transactions
-   **Zero Balance Filter**: Toggle to hide users with settled accounts
-   **Local Storage**: Encrypted SQLite database for data persistence
-   **Cross-Platform**: Works on iOS, Android, and Web
-   **Material Design**: Clean UI using React Native Paper components
-   **TypeScript**: Full type safety and better development experience

## 🛠️ Tech Stack

-   **Framework**: React Native with Expo
-   **Navigation**: Expo Router
-   **Database**: SQLite with SQLCipher encryption
-   **UI Components**: React Native Paper
-   **Language**: TypeScript
-   **State Management**: React Hooks
-   **Styling**: React Native StyleSheet

## 📋 Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn
-   Expo CLI (`npm install -g @expo/cli`)
-   iOS Simulator (macOS) or Android Emulator/Device

## 🚀 Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd creditbook
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Start the development server**

    ```bash
    npm start
    ```

4. **Run on your preferred platform**
    - **iOS**: Press `i` in the terminal or scan QR code with Camera app
    - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
    - **Web**: Press `w` in the terminal

## 📱 Usage

### Core Features

1. **Add Users**: Use the "+" button in the header to create new user accounts
2. **View Transactions**: Tap on any user to see their detailed transaction history
3. **Add Transactions**: From the user details screen, add credit/debit transactions
4. **Filter Users**: Toggle "Hide Settled Accounts" to show only users with outstanding balances
5. **Manage Users**: Edit user names or delete users from the main screen

### Transaction Types

-   **Credit**: Money received (increases balance)
-   **Debit**: Money paid out (decreases balance)

## 🏗️ Project Structure

```
creditbook/
├── app/                    # App screens and navigation
│   ├── index.tsx          # Home screen with user list
│   ├── details.tsx        # User details and transactions
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── UserTable.tsx      # User list table
│   ├── TransactionTable.tsx # Transaction list table
│   ├── Modal.tsx          # Generic modal component
│   └── ...
├── services/              # Business logic and data access
│   ├── database.service.ts # Database operations
│   └── query.service.ts   # SQL query builder
├── constants/             # Database schema and constants
├── enums/                 # TypeScript enums
├── types/                 # TypeScript interfaces
├── stylesheets/           # Styling definitions
└── assets/                # Images and fonts
```

## 🗄️ Database Schema

### Users Table

-   `userId` (INTEGER, PRIMARY KEY): Unique user identifier
-   `name` (TEXT): User display name
-   `balance` (REAL): Current account balance

### Transactions Table

-   `transactionId` (INTEGER, PRIMARY KEY): Unique transaction identifier
-   `userId` (INTEGER): Associated user
-   `amount` (INTEGER): Transaction amount
-   `type` (TEXT): "credit" or "debit"
-   `date` (TEXT): ISO timestamp
-   `remark` (TEXT): Optional transaction note

### Counters Table

-   `userId` (INTEGER): Next user ID counter
-   `transactionId` (INTEGER): Next transaction ID counter

## 🔧 Development

### Available Scripts

```bash
npm start          # Start development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Run ESLint
npm run reset-project # Reset project files
```

### Code Style

-   ESLint configuration included
-   TypeScript for type checking
-   Prettier recommended for formatting

## 📦 Building for Production

### EAS Build (Recommended)

1. **Install EAS CLI**

    ```bash
    npm install -g @expo/eas-cli
    ```

2. **Build for production**
    ```bash
    eas build --platform all
    ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Known Issues

### Current Limitations

-   **TypeScript Version**: Currently using `~5.8.3` which may not be available - consider `~5.6.3`
-   **Style Issues**: Some styles use `margin: "auto"` which is invalid in React Native
-   **Counter Logic**: Inconsistent ID generation between users and transactions
-   **Navigation**: Uses `router.replace()` which may affect navigation history

### Security Considerations

-   SQLCipher encryption is enabled for local data protection
-   No cloud backup - data is stored locally on device
-   Consider implementing data export/import for backup purposes

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ using React Native and Expo**
