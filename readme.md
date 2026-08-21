# DeployX

DeployX is a deployment platform I built to make deploying GitHub projects simpler.

The idea is simple: connect GitHub, select a repository, click deploy, and let DeployX handle the build and deployment process.

I built this project to understand what happens behind a simple "Deploy" button and to get hands-on experience with full-stack development, GitHub automation, CI/CD, cloud deployment, and real-time systems.

## What DeployX Does

With DeployX, a user can:

- Sign in to the platform
- Connect GitHub
- View available repositories
- Select a repository and branch
- Choose a root directory when needed
- Start a deployment
- Track deployment status
- View deployment/build logs
- Get the deployed website URL
- Redeploy a project
- Roll back a deployment

The main flow is:

```text
User
  ↓
DeployX Dashboard
  ↓
Select GitHub Repository
  ↓
Create Deployment
  ↓
GitHub Actions
  ↓
Checkout Repository
  ↓
Install Dependencies
  ↓
Build Project
  ↓
Deploy to Vercel
  ↓
Deployment URL
  ↓
DeployX Backend
  ↓
Dashboard
```

## Why I Built It

I wanted to build something beyond a normal CRUD application.

Deployment platforms look simple from the outside, but a lot happens behind the scenes. DeployX gave me a practical way to learn about:

- GitHub OAuth and GitHub Apps
- Repository access and permissions
- GitHub Actions
- CI/CD workflows
- Build environments
- Vercel deployment
- REST APIs
- WebSockets and Socket.IO
- MongoDB
- Authentication
- Deployment status and logs
- Environment variables and secrets
- Handling failed deployments

The project is still evolving, but the core deployment flow works end-to-end.

# Features

## GitHub Integration

DeployX uses GitHub as the source for projects.

Users can connect GitHub and select a repository they want to deploy.

A GitHub App is used for repository access instead of asking users for their GitHub password.

## Repository and Branch Selection

Users can choose:

- Repository
- Branch
- Root directory

The root directory is useful for repositories containing more than one application.

For example:

```text
my-project/
├── frontend/
├── backend/
└── README.md
```

The user can choose `frontend/` as the deployment root.

## Automated Builds

After a deployment is started, DeployX triggers a GitHub Actions workflow.

The workflow handles:

```text
Checkout
   ↓
Setup Node.js
   ↓
Install Dependencies
   ↓
Build Project
   ↓
Prepare Deployment
   ↓
Deploy
```

## Vercel Deployment

DeployX currently uses Vercel for hosting.

After a successful build, the Vercel CLI is used to deploy the project and return the deployment URL.

Deployments can use a project-specific name, for example:

```text
onlineportfolio-deployx.vercel.app
```

## Deployment Status

Deployments have a status such as:

```text
Queued
Building
Success
Failed
```

The current step can also be displayed, for example:

```text
Installing dependencies...
Building project...
Deploying to Vercel...
Deployment Complete
```

## Build Logs

DeployX displays deployment logs in the deployment details page.

A successful deployment can show information such as:

```text
Deployment queued...

Branch: main

GitHub Actions build queued.

Repository checked out successfully.

Installing project dependencies...

Project build completed.

Installing Vercel CLI...

Deploying project to Vercel...

Deployment completed successfully.

Deployment URL:
https://example.vercel.app
```

The goal is to give users useful information without forcing them to open GitHub Actions.

## Failure Information

Failed deployments are also reported back to DeployX.

Instead of only showing:

```text
Deployment Failed
```

the platform can show the stage where the failure happened, such as:

```text
Repository checked out successfully.

Installing project dependencies...

Build failed.
```

This is important because normal users may not have access to the GitHub repository or its Actions logs.

## Deployment History

DeployX stores deployment records so users can see previous deployment attempts.

Deployment information can include:

- Status
- Deployment URL
- Timestamp
- Current step
- Logs
- Project
- Branch

## Redeploy and Rollback

The deployment interface includes options for redeploying and rolling back deployments.

This makes it easier to recover from a bad deployment without starting everything manually.

## Real-Time Communication

DeployX uses Socket.IO for real-time communication.

The deployment page can join a deployment-specific socket room and receive updates from the backend.

The intended flow is:

```text
GitHub Actions
      ↓
DeployX Backend
      ↓
Socket.IO
      ↓
Deployment Details Page
```

This allows deployment information to update without depending completely on manual page refreshes.

# Tech Stack

## Frontend

- React
- React Router
- Axios
- Socket.IO Client
- CSS

The frontend handles:

- Authentication
- Dashboard
- GitHub repository selection
- Projects
- Deployments
- Deployment details
- Logs
- Status updates

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Socket.IO
- Axios
- dotenv

The backend handles:

- Authentication
- GitHub integration
- Project management
- Deployment creation
- Deployment records
- Deployment status
- GitHub callbacks/webhooks
- Real-time updates

## Deployment and Infrastructure

- GitHub Actions
- GitHub App
- Vercel CLI
- Vercel
- MongoDB
- Render/backend hosting

# Project Structure

A simplified structure looks like this:

```text
DeployX/
│
├── .github/
│   └── workflows/
│       └── deployx-build.yml
│
├── client/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── Layout/
│       ├── pages/
│       ├── routes/
│       └── socket/
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   └── utils/
│
└── README.md
```

The structure can change as the project grows.

# How Deployment Works

One of the most important parts of DeployX is the GitHub Actions workflow.

The workflow receives information such as:

```text
owner
repo
branch
root_directory
deployment_id
output_directory
project_slug
```

It then performs the deployment.

## 1. Create GitHub App Token

DeployX creates a temporary GitHub App token.

The token is used to access the selected repository.

## 2. Checkout Repository

The selected repository and branch are checked out into the GitHub Actions runner.

## 3. Setup Node.js

The workflow prepares the Node.js environment.

## 4. Install Dependencies

If a `package-lock.json` exists:

```bash
npm ci
```

Otherwise:

```bash
npm install
```

## 5. Build Project

The workflow runs:

```bash
npm run build
```

The configured output directory is then checked.

## 6. Prepare Vercel Deployment

The Vercel CLI is installed and the project is prepared for deployment.

## 7. Deploy

The project is deployed to Vercel.

The resulting URL is captured by the workflow.

## 8. Report the Result

The workflow sends the deployment result back to the DeployX backend.

A successful deployment reports:

```text
status: success
url: deployment URL
currentStep: Deployment Complete
```

A failed deployment reports:

```text
status: failed
currentStep: Failed
```

The backend can then update the deployment stored in MongoDB.

# GitHub App

DeployX uses a GitHub App for repository access.

This allows the platform to request controlled repository permissions and create temporary access tokens when needed.

The workflow uses the generated token to check out the selected repository.

# Environment Variables

Sensitive configuration should be stored in environment variables and deployment secrets.

Typical backend variables include:

```env
PORT=4000
MONGO_URL
SECRET

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL

GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY_PATH
GITHUB_WEBHOOK_SECRET

VERCEL_TOKEN
DEPLOYX_DEPLOYMENT_SECRET
```

The frontend may use:

```env
REACT_APP_API_URL=https://deployx-7k6m.onrender.com
```

The exact variables depend on the environment.

Never commit real secrets to GitHub.

# GitHub Actions Secrets

The deployment workflow uses secrets such as:

```text
DEPLOYX_APP_CLIENT_ID
DEPLOYX_APP_PRIVATE_KEY
VERCEL_TOKEN
DEPLOYX_API_URL
DEPLOYX_DEPLOYMENT_SECRET
```

These should be stored using GitHub Secrets.

# Running Locally

Clone the project:

```bash
git clone <your-repository-url>
cd DeployX
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

Create the required `.env` files and configure the local environment.

Start the backend:

```bash
npm run dev
```

Start the frontend:

```bash
npm start
```

The exact commands can vary depending on the current package configuration.

# Typical User Flow

From the user's point of view, the deployment process is intentionally simple:

```text
Connect GitHub
      ↓
Select Repository
      ↓
Select Branch
      ↓
Select Root Directory
      ↓
Deploy
      ↓
Deployment Queued
      ↓
Build
      ↓
Deploy
      ↓
Success
      ↓
Open Website
```

The complicated work happens behind the scenes.

# Current Limitations

DeployX is still a project under development and is not intended to replace mature production platforms.

Some areas that can be improved include:

- More project-type detection
- Better CI testing
- Docker support
- More detailed build logs
- Fully real-time deployment updates
- Better error messages
- Environment variable management
- Health checks
- More deployment providers
- More robust rollback handling

# Future Plans

## CI/CD

The next stage is a more complete pipeline:

```text
Checkout
   ↓
Install
   ↓
Lint
   ↓
Test
   ↓
Build
   ↓
Deploy
```

## Docker

Docker support is planned so DeployX can detect a `Dockerfile` and build container-based projects.

The intended flow is:

```text
Dockerfile
    ↓
Docker Build
    ↓
Docker Image
    ↓
Container Deployment
```

## DevOps Features

Possible future improvements include:

- Docker support
- CI/CD pipelines
- Environment variables
- Deployment health checks
- Better rollback
- Automatic redeployment
- Deployment metrics
- Better logs
- Multiple deployment providers

# What I Learned

This project has been a practical way to learn how several different systems work together.

Some of the biggest things I learned are:

- GitHub APIs
- GitHub OAuth
- GitHub Apps
- GitHub Actions
- CI/CD
- REST APIs
- WebSockets
- Socket.IO
- MongoDB
- Authentication
- Environment variables
- Cloud deployment
- Deployment debugging
- Handling asynchronous processes

One of the most useful parts was dealing with problems that worked locally but behaved differently inside a CI environment. It made me understand that building an application and deploying an application are two different problems.

# Project Goal

The long-term goal of DeployX is to become a simple developer-focused deployment platform.

The basic idea is:

```text
GitHub Repository
       ↓
     DeployX
       ↓
   Build Project
       ↓
   Run Pipeline
       ↓
     Deploy
       ↓
   Live Website
```

The user should not need to worry about everything happening in between.

They should be able to select a repository, click **Deploy**, and get a working deployment with useful logs and a clear result.

# Author

**Abdul Malik**

B.Tech CSE Student

DeployX was built as a hands-on project to learn full-stack development, GitHub automation, deployment systems, CI/CD, and DevOps concepts.

# Final Note

DeployX started as a project to understand how deployment platforms work.

It is still being improved, but the main idea remains simple:

> **Take the complicated parts of deploying a project and make them easier for the developer.**