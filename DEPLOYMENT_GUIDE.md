# Employee Sentiment App - Deployment Guide

This guide will help you deploy the Employee Sentiment App to Heroku for external testing.

## Prerequisites

- [Git](https://git-scm.com/downloads) installed
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- Your Employee Sentiment App codebase ready to deploy

## Step 1: Set Up MongoDB Atlas

1. **Create a MongoDB Atlas account** (if you don't have one already)
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Sign up for a free account

2. **Create a new cluster**
   - Choose the free tier (M0)
   - Select a cloud provider and region closest to your testers
   - Name your cluster (e.g., "employee-sentiment-test")

3. **Set up database access**
   - Create a database user with a strong password
   - Note down these credentials for later use

4. **Configure network access**
   - Set IP access to "Allow Access from Anywhere" (0.0.0.0/0) for testing
   - Note: For production, you would restrict this to specific IPs

5. **Get your connection string**
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string (it will look like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`)
   - Replace `<password>` with your actual password

## Step 2: Deploy to Heroku

1. **Create a Heroku account** (if you don't have one already)
   - Go to [Heroku](https://signup.heroku.com/)
   - Sign up for a free account

2. **Login to Heroku CLI**
   ```
   heroku login
   ```

3. **Create a new Heroku app**
   ```
   cd employee-sentiment-app
   heroku create employee-sentiment-test
   ```

4. **Configure environment variables**
   ```
   heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"
   heroku config:set NODE_ENV=production
   ```

5. **Push your code to Heroku**
   ```
   git push heroku main
   ```

6. **Open your app**
   ```
   heroku open
   ```

## Step 3: Test User Access

1. **Share the Heroku app URL with your testers**
   - The URL will be something like: `https://employee-sentiment-test.herokuapp.com`

2. **Provide tester credentials**
   - Username: `tester1`, Password: `access123`
   - Username: `tester2`, Password: `access456`
   - Username: `admin`, Password: `adminaccess789`

3. **Instruct testers to:**
   - Visit the app URL
   - Login with their provided credentials
   - Test the application functionality

## Step 4: Monitor and Manage

1. **View logs**
   ```
   heroku logs --tail
   ```

2. **Scale your app if needed**
   ```
   heroku ps:scale web=1
   ```

3. **Add more testers**
   - Edit the `middleware/auth.js` file to add more test users
   - Commit and push the changes to Heroku

## Security Considerations

- The test deployment uses Basic Authentication, which is suitable for testing but not for production
- All data is transmitted over HTTPS
- Test user credentials should be changed regularly
- The MongoDB Atlas cluster is protected by username/password authentication
- For a production deployment, additional security measures would be recommended

## Troubleshooting

- **App crashes on startup**: Check Heroku logs with `heroku logs --tail`
- **Database connection issues**: Verify your MongoDB Atlas connection string and network access settings
- **Authentication problems**: Ensure testers are using the correct credentials

## Removing the Test Deployment

When testing is complete, you can remove the deployment:

1. **Delete the Heroku app**
   ```
   heroku apps:destroy --app employee-sentiment-test --confirm employee-sentiment-test
   ```

2. **Remove the MongoDB Atlas cluster** (if no longer needed)
   - Go to your MongoDB Atlas dashboard
   - Delete the cluster used for testing
