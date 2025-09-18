# Lost & Found and Issue Reporting System - Setup Guide

## Phase 1 Complete ✅

This guide will help you set up and run the Lost & Found and Issue Reporting System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB Atlas account
- Cloudinary account (for image uploads)

## Project Structure

```
LostAndFound/
├── backend/                 # Node.js/Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── contexts/      # React contexts
│   │   └── App.tsx        # Main app component
│   └── package.json       # Frontend dependencies
└── README.md              # Project documentation
```

## Backend Setup

### 1. Install Dependencies

```bash
# Navigate to the project root
cd LostAndFound

# Install backend dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory (copy from `env.example`):

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lostandfound?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=5000
NODE_ENV=development
```

### 3. Start Backend Server

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

The backend will be running on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the frontend directory (copy from `env.example`):

```bash
cp env.example .env.local
```

Update the `.env.local` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Start Frontend Development Server

```bash
npm start
```

The frontend will be running on `http://localhost:3000`

## Database Setup

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get your connection string and update the `MONGODB_URI` in your `.env` file

### Database Collections

The following collections will be created automatically when you first run the application:

- `users` - User accounts and profiles
- `lostfounds` - Lost and found items
- `issues` - Campus issues and reports

## Cloudinary Setup (for Image Uploads)

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and API secret from the dashboard
3. Update the Cloudinary configuration in your `.env` file

## Testing the Application

### 1. Register a New User

1. Open `http://localhost:3000`
2. Click "Create a new account"
3. Fill in the registration form
4. Choose role: Student or Admin

### 2. Login

1. Use your registered credentials to login
2. You'll be redirected to the dashboard

### 3. Test Features

- **Dashboard**: View quick actions and overview
- **Lost & Found**: Report and manage lost/found items
- **Issues**: Report and track campus issues
- **Profile**: Manage your account settings
- **Admin Panel**: (Admin users only) Manage users and verify items

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Lost & Found
- `GET /api/lost-found` - Get all items (with filters)
- `POST /api/lost-found` - Create new item
- `PUT /api/lost-found/:id/claim` - Claim item
- `PUT /api/lost-found/:id/verify` - Verify item (Admin)

### Issues
- `GET /api/issues` - Get all issues (with filters)
- `POST /api/issues` - Create new issue
- `PUT /api/issues/:id/upvote` - Upvote issue
- `PUT /api/issues/:id/status` - Update status (Admin)

## User Roles

### Student
- Register and login
- Report lost/found items
- Report campus issues
- Upvote issues
- Claim lost items
- View all items and issues

### Admin
- All student permissions
- Verify lost/found items
- Assign and resolve issues
- Update issue status
- Manage user roles
- View analytics dashboard

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your MongoDB Atlas connection string
   - Ensure your IP is whitelisted
   - Verify database user credentials

2. **JWT Token Errors**
   - Check your JWT_SECRET in .env file
   - Ensure token is not expired

3. **CORS Issues**
   - Backend CORS is configured for localhost:3000
   - Update CORS settings if using different ports

4. **Image Upload Issues**
   - Verify Cloudinary configuration
   - Check API key and secret

### Development Tips

1. **Backend Logs**: Check console for server logs
2. **Frontend Console**: Open browser dev tools for client-side errors
3. **Network Tab**: Monitor API requests and responses
4. **Database**: Use MongoDB Compass to view your data

## Next Steps

Phase 1 is complete with core functionality. Future phases will include:

- **Phase 2**: Advanced UI components, image upload, real-time notifications
- **Phase 3**: Analytics dashboard, email notifications, mobile app
- **Phase 4**: Advanced features, reporting, and optimization

## Support

If you encounter any issues:

1. Check the console logs for errors
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check MongoDB and Cloudinary connections

For additional help, refer to the README.md file or create an issue in the repository.
