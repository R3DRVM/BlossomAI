# 🌸 BlossomAI - Institutional DeFi Terminal

A professional DeFi platform combining terminal-style data interfaces with conversational AI and visual strategy building for institutional-grade yield optimization.

## 🚀 Features

- **Terminal Interface** - Multi-panel terminal inspired by institutional trading platforms
- **AI Strategy Assistant** - Natural language queries for yield optimization and risk analysis
- **Strategy Builder** - Interactive drag & drop strategy creation with visual flow
- **Strategies Marketplace** - AI-curated strategies with comprehensive breakdowns
- **Risk Management** - Institutional-grade risk assessment and analysis
- **Yield Aggregation** - Access to 100+ DeFi protocols with automated rebalancing

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI + Shadcn/ui
- **Build Tool**: Vite
- **Deployment**: Vercel

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Vercel Deployment
1. **Connect GitHub** to Vercel
2. **Import Repository** - Select BlossomAI
3. **Deploy** - Vercel will automatically detect the React app
4. **Access** - Your app will be live at `https://your-app.vercel.app`

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
│   ├── api/               # Vercel API functions
│   └── index.html         # Entry point
├── server/                 # Express server (local development)
├── shared/                 # Shared schemas and types
├── vercel.json            # Vercel configuration
└── package.json           # Dependencies and scripts
```

## 🔌 API Endpoints

All API endpoints are implemented as Vercel serverless functions:

- `GET /api/auth/user` - User authentication status
- `GET /api/yield-opportunities` - Yield opportunities data
- `GET /api/strategies` - User strategies (wallet required)
- `GET /api/portfolio` - User portfolio (wallet required)
- `GET /api/chat/messages` - Chat messages (wallet required)
- `GET /api/risk-assessment/:id` - Risk assessment data
- `GET /api/protocols` - DeFi protocols information

## 🌐 Live Demo

Visit the deployed application to experience the full DeFi terminal interface.

## 🔮 Future Enhancements

- **Wallet Integration** - Web3 wallet connection for full functionality
- **Real-time Data** - Live market data feeds and updates
- **Strategy Execution** - Automated strategy deployment
- **Advanced Analytics** - Portfolio performance tracking
- **Multi-chain Support** - Cross-chain strategy management

## 📝 License

MIT License - See LICENSE file for details.

---

Built with ❤️ for the DeFi community
