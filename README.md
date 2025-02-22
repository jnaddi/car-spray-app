# Car Spray Shop Management System

A comprehensive management system for car spray painting businesses built with Next.js and Supabase.

## Features

- Customer Management
- Inventory Tracking
- Invoice Generation
- Payment Processing
- Low Stock Alerts
- Receipt Generation

## Tech Stack

- Next.js 15
- TypeScript
- Supabase
- Tailwind CSS
- shadcn/ui Components

## Getting Started

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials:
     \`\`\`env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

- `/src/app` - Next.js app router pages and layouts
- `/src/components` - React components including UI components
- `/src/lib` - Utility functions and configurations
- `/public` - Static assets

## Deployment

This application can be deployed on [Vercel](https://vercel.com). Make sure to:
1. Configure your environment variables in Vercel
2. Connect your Supabase database
3. Deploy through Vercel's GitHub integration

