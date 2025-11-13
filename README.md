# TradeX - Stock Tracker App

A modern web application for tracking stocks, managing watchlists, and receiving personalized market insights via email. Built with Next.js, MongoDB, and TradingView widgets.

## Features

- **User Authentication**: Email/password authentication with better-auth
- **Stock Search**: Real-time stock search with symbol and company information
- **Watchlist Management**: Add/remove stocks to personal watchlist with persistent storage
- **Stock Details**: Interactive stock charts and financial data using TradingView widgets
- **Market Overview**: Dashboard with market overview, heatmap, and trending stocks
- **Email Notifications**: Personalized stock market news delivered via Nodemailer
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS and shadcn/ui components

## Tech Stack

### Frontend
- **Next.js 15.5** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components (buttons, dialogs, dropdowns, etc.)
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - Serverless backend
- **MongoDB** - Database with Mongoose ODM
- **better-auth** - Authentication & session management
- **Nodemailer** - Email sending

### External Services
- **TradingView** - Stock charts and financial widgets
- **Finnhub API** - Stock search and market data
- **Inngest** - Job scheduling for periodic email tasks

## Project Structure

```
stock_tracker/
├── app/                          # Next.js app router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── layout.tsx
│   ├── (root)/                   # Main app routes
│   │   ├── page.tsx              # Dashboard home
│   │   ├── stocks/[symbol]/      # Stock detail page
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   │   └── inngest/              # Inngest webhook
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── Header.tsx                # Navigation header
│   ├── SearchCommand.tsx         # Stock search dialog
│   ├── TradingViewWidget.tsx     # TradingView chart wrapper
│   ├── WatchlistButton.tsx       # Add/remove watchlist button
│   ├── WatchlistPanel.tsx        # Display user's watchlist
│   ├── UserDropdown.tsx          # User menu
│   └── ui/                       # shadcn/ui components
├── database/
│   ├── mongoose.ts               # MongoDB connection
│   └── models/
│       └── watchlist.model.ts    # Watchlist schema
├── lib/
│   ├── constants.ts              # App constants & TradingView configs
│   ├── utils.ts                  # Utility functions
│   ├── actions/                  # Server actions
│   │   ├── auth.actions.ts       # Sign up, sign in, sign out
│   │   ├── watchlist.actions.ts  # Watchlist CRUD
│   │   ├── finnhub.actions.ts    # Stock search & market data
│   │   └── user.action.ts        # User queries
│   ├── better-auth/
│   │   └── auth.ts               # Authentication config
│   ├── inngest/                  # Job scheduling
│   │   ├── client.ts             # Inngest client
│   │   ├── functions.ts          # Background jobs
│   │   └── prompts.ts            # Email templates
│   └── nodemailer/               # Email sending
│       ├── index.ts              # Mailer setup
│       └── templates.ts          # Email HTML templates
├── hooks/                        # React hooks
│   ├── useDebounce.ts            # Debounce search
│   └── useTradingViewWidget.tsx  # TradingView widget loader
├── types/
│   └── global.d.ts               # Global type definitions
├── public/
│   └── assets/                   # Images, icons, logos
├── middleware/                   # Next.js middleware
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ or higher
- MongoDB instance (local or cloud - Atlas recommended)
- Finnhub API key (free tier available)
- Inngest account (optional, for email features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chittaranjan27/stock_tracker_app
   cd stock_tracker_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI= YOUR_DB_URL

   # Authentication
   BETTER_AUTH_SECRET=better_auth_key
   BETTER_AUTH_URL=better_auth_url

   # External APIs
   FINNHUB_API_KEY=your-finnhub-key-here
   INNGEST_SIGNING_KEY=your-inngest-key-here

   # Email (Nodemailer)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password

   # App domain (for email templates)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Features Implementation

### Authentication
- Users sign up with email and password
- Sessions stored in MongoDB via better-auth
- Protected routes redirect to `/sign-in`

### Watchlist
- Add/remove stocks from watchlist
- Persistent storage in MongoDB
- API endpoints: `GET`, `POST`, `DELETE` `/api/watchlist`
- Watchlist displayed on dashboard with quick links to stock details

### Stock Search
- Real-time search via Finnhub API
- Debounced to reduce API calls
- Search results link to stock detail pages
- Option to add stock to watchlist from search

### Stock Details
- Dynamic routes: `/stocks/[symbol]`
- Interactive TradingView charts:
  - Symbol info & pricing
  - Candlestick charts
  - Baseline chart
  - Technical analysis
  - Company profile
  - Financial metrics
- Add to watchlist button on detail page

### Dashboard
- Market overview widget (top stocks, sectors)
- Stock heatmap by market cap
- Trending stocks timeline
- Market quotes
- User's watchlist panel with quick actions

### Email Notifications
- Inngest scheduled jobs send personalized email
- Uses Nodemailer with HTML templates
- Email branding: TradeX with Group.png logo
- Includes user's watchlist stocks and market news

## Available Scripts

```bash
# Development server (auto-reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Test database connection
npx ts-node scripts/test-db.ts
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `BETTER_AUTH_SECRET` | Secret key for session encryption | `my-secret-key-123` |
| `BETTER_AUTH_URL` | Auth callback URL | `http://localhost:3000` |
| `FINNHUB_API_KEY` | Finnhub API key for stock data | `abc123def456` |
| `INNGEST_SIGNING_KEY` | Inngest webhook signing key | `signkey_abc123` |
| `EMAIL_USER` | Nodemailer sender email | `noreply@tradex.com` |
| `EMAIL_PASSWORD` | Nodemailer password or app password | `your-app-password` |
| `NEXT_PUBLIC_APP_URL` | Public app URL (used in emails) | `https://stock-market-dev.vercel.app` |

## API Routes

### Authentication
- `POST /api/auth/*` - better-auth endpoints

### Watchlist
- `GET /api/watchlist` - Get user's watchlist (requires auth)
- `POST /api/watchlist` - Add stock to watchlist (requires auth)
- `DELETE /api/watchlist?symbol=AAPL` - Remove stock (requires auth)

### Jobs
- `POST /api/inngest` - Inngest webhook for scheduled jobs

## Database Schema

### Watchlist Collection
```typescript
interface WatchlistItem {
  userId: string;
  symbol: string;      
  company: string;     
  addedAt: Date;
}

// Indexes
- { userId: 1, symbol: 1 } (unique)
- { userId: 1 }
```

### User Collection
Managed by better-auth:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
}
```

## Authentication Flow

1. User signs up at `/sign-up`
2. Credentials stored in MongoDB via better-auth
3. On sign in, session token generated and stored in httpOnly cookie
4. Protected routes check session via `auth.api.getSession({ headers: await headers() })`
5. Unauthorized users redirected to `/sign-in`
6. Sign out clears session and cookie

## Watchlist Implementation

### Client-Side (WatchlistButton.tsx)
- Click toggles local state immediately (optimistic UI)
- Makes async POST/DELETE to `/api/watchlist`
- Reverts state if API fails
- Handles add & remove workflows

### Server-Side (app/api/watchlist/route.ts)
- Extracts user from session via better-auth
- Validates symbol and company
- Calls watchlist action functions
- Returns JSON response

### Database (Watchlist Model)
- Unique constraint on (userId, symbol) prevents duplicates
- Indexed on userId for fast queries
- addedAt timestamp tracks when added

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy on commit

```bash
# Or deploy via CLI
vercel
```

### Environment Setup for Production
- Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
- Email templates use this URL for image assets (Group.png logo)
- Ensure MongoDB connection string allows Vercel IPs

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` in `.env.local`
- Check MongoDB user has read/write permissions
- For Atlas, add Vercel IPs to IP Whitelist (or use 0.0.0.0/0 for development)

### Email Not Sending
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- For Gmail, use App Password, not account password
- Check spam folder for test emails

### TradingView Widgets Not Loading
- Verify `https://s3.tradingview.com/external-embedding/` is accessible
- Check browser console for CORS errors
- Ensure ad-blocker isn't blocking TradingView scripts

### Watchlist API 401 Errors
- Ensure cookies are being sent with requests (`credentials: 'include'`)
- Verify session exists in browser (check cookies tab in DevTools)
- Check `BETTER_AUTH_SECRET` matches in `.env.local`

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, bugs, or feature requests, please open an issue on GitHub.

## Roadmap

- [ ] Real-time price alerts
- [ ] Portfolio performance tracking
- [ ] Advanced charting with technical indicators
- [ ] Social features (share watchlists)
- [ ] Mobile app (React Native)
- [ ] Dark/light theme toggle
- [ ] Multi-currency support

## Acknowledgments

- [TradingView](https://www.tradingview.com/) - Financial charts and widgets
- [Finnhub](https://finnhub.io/) - Stock market data API
- [better-auth](https://www.better-auth.com/) - Authentication library
- [Next.js](https://nextjs.org/) - React framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Vercel](https://vercel.com/) - Deployment platform
