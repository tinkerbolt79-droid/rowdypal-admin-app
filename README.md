# RowdyPal Admin App

A React-based web application built with Vite.

## Prerequisites

- Node.js (version 20 or higher)
- npm or yarn package manager

## Getting Started

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/tinkerbolt79-droid/rowdypal-ui-app.git
   ```

2. Navigate to the project directory:

   ```
   cd rowdypal-ui-app
   ```

3. Install dependencies:

   ```
   npm install
   ```

   or if using yarn:

   ```
   yarn install
   ```

### Running the Application

To start the development server:

```
npm run dev
```

or with yarn:

```
yarn dev
```

The application will start and you should see output similar to:

```
  VITE v7.2.2  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### Accessing the Application

1. Open your web browser
2. Navigate to the local address shown in the terminal output (typically `http://localhost:5173/`)
3. The application should load and display the login page

### Firebase Hosting

The application is hosted on Firebase Hosting and is available at the following domains:

- https://rowdypal-8db00.web.app
- https://rowdypal-8db00.firebaseapp.com

To deploy the application to Firebase Hosting:

1. Build the application:

   ```
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```
   firebase deploy --only hosting
   ```

Note: You need to have the Firebase CLI installed and be logged in to deploy.

### Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the application for production
- `npm run preview` - Previews the production build locally

### Application Features

- User authentication (login/logout)
- Events view
- Payments management (credit cards, bank accounts)
- Profile management
- Debug events panel

### Project Structure

```
rowdypal-ui-app/
├── src/
│   ├── components/     # React components
│   ├── context/        # Authentication context
│   ├── App.jsx         # Main application component
│   └── main.jsx        # Entry point
├── public/             # Static assets
└── vite.config.js      # Vite configuration
```

### Dependencies

- React
- React Router DOM
- Firebase (for authentication)
- Vite (build tool)
