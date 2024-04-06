# TimeItIn

## About

This Hour Registration Web App is a comprehensive solution for businesses and freelancers to manage employee hours efficiently. Built using TypeScript and JavaScript, it features a user-friendly interface for creating employee profiles and registering their work hours. This application consists of a front-end that communicates with a back-end server, both of which require setup.

## Getting Started

### Prerequisites

- Node.js and npm (Node Package Manager)
- Firebase account (for authentication and database services)

### Setting Up the Front-End

1. **Clone the repository** to your local machine.
2. **Navigate to the front-end directory** and run `npm install` to install the required packages.
3. **Configure Environment Variables:**

   - Create a `.env` file in the root of the front-end directory.
   - Add the following environment variables:
     ```
     REACT_APP_BACKEND_URL=<Your Backend URL>
     REACT_APP_FIREBASE_PRIVATE_KEY_ID=<Your Firebase Private Key ID>
     REACT_APP_FIREBASE_PROJECT_ID=<Your Firebase Project ID>
     ```
   - You need to replace the placeholders with your actual Firebase project details.

4. **Firebase Setup:**
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a new project if you haven't already.
   - Navigate to your project settings to find your `apiKey` and `projectId`.
   - These details will be used in your `.env` file.

### Example .env file for Front-End

```
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_FIREBASE_PRIVATE_KEY_ID=xxx
REACT_APP_FIREBASE_PROJECT_ID=myapp-project-123
```

### Setting Up the Back-End

1. **Navigate to the back-end directory** and run `npm install` to install the dependencies.
2. **Configure Environment Variables:**
   - Similar to the front-end, create a `.env` file in the root of your back-end directory.
   - Set up your Firebase database URL:
     ```
     FIREBASE_DATABASE_URL="https://<Your Firebase Database URL>"
     ```
3. **Firebase Admin Setup:**
   - In the Firebase Console, navigate to your project's settings, go to the "Service accounts" tab, and generate a new private key. Download this JSON file.
   - Rename the downloaded file to `firebase-admin.json` and place it in your back-end directory.

### Example .env file for Back-End

```
FIREBASE_DATABASE_URL="https://myapp-project-123-default-rtdb.europe-west1.firebasedatabase.app/"
```

## Running the Application

- **Front-End:** Navigate to the front-end directory and run `npm start`. This will start the React application.
- **Back-End:** In a separate terminal, navigate to the back-end directory and run `node server.js` to start the server.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues to discuss proposed changes or additions.
