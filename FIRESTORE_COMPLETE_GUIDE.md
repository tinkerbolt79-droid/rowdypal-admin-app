# Complete Firestore Configuration Guide

This guide consolidates all the information you need to configure Firestore for the RowdyPal application. Follow these steps to resolve "Permission denied" errors and properly set up Firestore security rules.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firestore Setup](#firestore-setup)
3. [Deploying Firestore Rules](#deploying-firestore-rules)
4. [Verifying Configuration](#verifying-configuration)
5. [Enabling Required APIs](#enabling-required-apis)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before configuring Firestore, make sure you have:

1. Node.js installed
2. Firebase CLI installed globally:
   ```bash
   npm install -g firebase-tools
   ```
3. You're logged into Firebase:
   ```bash
   firebase login
   ```

## Firestore Setup

The application requires proper Firestore security rules to allow users to access their own data. The project includes a [firestore.rules](file:///Users/pmalla/git/RowdyPal/rowdypal-ui-app/firestore.rules) file with the following configuration:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own profile
    match /users/{userId} {
      allow create, read, update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // Prevent users from deleting their profile
    }

    // Allow users to read, create, update and delete their own events
    match /events/{eventId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }

    // Allow users to read public data if any
    match /{document=**} {
      allow read: if false; // Default deny for all other documents
    }
  }
}
```

These rules allow users to:

- Create, read, and update their own profile (but not delete it)
- Create, read, update, and delete their own events
- Not access other users' data

Note: During document creation, `resource.data.userId` doesn't exist yet, so we only check for authentication when creating events. For read/update/delete operations, we verify that the user ID matches the document's userId field.

## Deploying Firestore Rules

To deploy the Firestore rules, use one of these commands:

1. Deploy only Firestore rules:

   ```bash
   firebase deploy --only firestore
   ```

2. Alternative command if the above doesn't work:

   ```bash
   firebase deploy --only firestore:rules
   ```

3. Deploy Firestore and hosting (skip Data Connect if having issues):

   ```bash
   firebase deploy --except dataconnect
   ```

4. Deploy only Firestore and hosting:

   ```bash
   firebase deploy --only firestore,hosting
   ```

5. Deploy everything:
   ```bash
   firebase deploy
   ```

## Verifying Configuration

After deployment, verify that the rules are correctly configured:

1. Go to the Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Click "Firestore Database" in the left sidebar
4. Click the "Rules" tab
5. Confirm that your rules match the content of [firestore.rules](file:///Users/pmalla/git/RowdyPal/rowdypal-ui-app/firestore.rules)

### Testing Rules with the Simulator

Firebase provides a rules simulator to test your rules:

1. In the Firebase Console, on the Rules tab, click "Run tests"
2. Add test cases:
   - Test read access to `/events` with authenticated user
   - Test create access to `/events` with authenticated user
   - Test update access to `/events/{eventId}` with matching userId
   - Test delete access to `/events/{eventId}` with matching userId

### Manual Rules Update

If you can't deploy via CLI, manually update the rules in the Firebase Console:

1. Go to https://console.firebase.google.com/
2. Select your project
3. Go to Firestore Database > Rules tab
4. Copy and paste the content of [firestore.rules](file:///Users/pmalla/git/RowdyPal/rowdypal-ui-app/firestore.rules) into the editor
5. Click "Publish"

## Enabling Required APIs

If you encounter deployment errors, you may need to manually enable the required APIs in Google Cloud Console:

1. Go to the Google Cloud Console: https://console.cloud.google.com/
2. Make sure you have selected the correct project
3. Navigate to "APIs & Services" > "Library"
4. Search for and enable the following APIs:
   - Cloud Firestore API
   - Firebase Data Connect API
   - Cloud SQL Admin API

### Alternative Method Using gcloud CLI

If you have the gcloud CLI installed, you can enable the APIs from the command line:

```bash
gcloud services enable firestore.googleapis.com \
    firebasedataconnect.googleapis.com \
    sqladmin.googleapis.com \
    --project=YOUR_PROJECT_ID
```

## Troubleshooting

### Common Issues and Solutions

#### Error: "Cannot understand what targets to deploy/serve"

This means the [firebase.json](file:///Users/pmalla/git/RowdyPal/rowdypal-ui-app/firebase.json) file is missing the Firestore configuration. Make sure your [firebase.json](file:///Users/pmalla/git/RowdyPal/rowdypal-ui-app/firebase.json) includes:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

#### Error: "Missing permissions to deploy to project"

This means your Google account doesn't have the necessary permissions. You need to be a Project Owner or have the "Cloud Firestore Admin" role.

#### Error: "HTTP Error: 404, Project does not exist"

Make sure you're using the correct project ID. You can check your project ID in the Firebase Console URL:
`https://console.firebase.google.com/project/YOUR_PROJECT_ID`

#### Data Connect Issues

If you're seeing errors related to Data Connect:

1. If you see "Cannot read properties of null (reading 'location')", check your [dataconnect/dataconnect.yaml](file:///Users/pmalla/git/RowdyPal/rowdypal-ui-app/dataconnect/dataconnect.yaml) file for proper configuration
2. If you see "Could not find connector.yaml", ensure all required Data Connect files exist
3. If you see billing-related errors, you may need to upgrade to the Blaze plan

If you don't need Data Connect functionality, you can deploy without it:

```bash
firebase deploy --except dataconnect
```

#### Issue: Rules don't match the expected structure

Make sure your rules exactly match the structure in [firestore.rules](file:///Users/pmalla/git/RowdyPal/rowdypal-ui-app/firestore.rules), especially:

- The `match /events/{eventId}` path
- The condition `request.auth != null && request.auth.uid == resource.data.userId`

#### Issue: Data structure mismatch

Make sure the events you're creating have a `userId` field that matches the authenticated user's UID.

When creating events in the app, we're setting:

```javascript
const docRef = await addDoc(collection(db, 'events'), {
  name: formData.name,
  date: formData.date,
  userId: currentUser.uid, // This must match request.auth.uid in rules
  createdAt: new Date(),
});
```

### General Debugging Steps

1. Check the browser console for detailed error messages
2. Verify that the user is properly authenticated
3. Check that the event documents being created have the correct `userId` field
4. Use the Firestore rules simulator to test your specific use cases
5. Try completely signing out and signing back in to refresh the auth token
6. Clear your browser cache and try again
7. Check if there are any typos in the rules
8. Make sure you clicked "Publish" after editing the rules in the console

### Create Firestore Database (if not exists)

If you haven't created a Firestore database yet:

1. Go to https://console.firebase.google.com/
2. Select your project
3. Click "Firestore Database" in the left sidebar
4. Click "Create database"
5. Choose "Production mode" or "Test mode"
6. Select a location
7. Click "Enable"

Note: For development, you can choose "Test mode" which allows read/write for 30 days. For production, use "Production mode" with your security rules.

### Still Having Issues?

1. Make sure you're in the project root directory (where [firebase.json](file:///Users/pmalla/git/RowdyPal/rowdypal-ui-app/firebase.json) is located)
2. Check that you're logged into the correct Google account
3. Verify that the project exists in the Firebase Console
4. Make sure the project has Firestore Database enabled
