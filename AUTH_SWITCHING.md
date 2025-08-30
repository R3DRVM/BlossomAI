# 🔄 Authentication Mode Switching Guide

## **🎯 Current Setup: Demo Mode (Default)**

Your BlossomAI platform is currently running in **demo mode** with:
- ✅ **Username-only authentication**
- ✅ **Acknowledgement checkbox**
- ✅ **localStorage sessions**
- ✅ **No database required**
- ✅ **Perfect for demos and testing**

## **🚀 How to Switch to Production Mode**

### **Option 1: Quick Switch (Demo → Production)**

1. **Edit** `client/src/lib/auth-config.ts`
2. **Change** `AUTH_MODE = 'demo'` to `AUTH_MODE = 'supabase'`
3. **Restart** your development server
4. **Set up Supabase** using the `SUPABASE_SETUP.md` guide

### **Option 2: Environment-Based Switching**

1. **Create** `.env.local` in your `client/` directory
2. **Add** `VITE_AUTH_MODE=supabase` for production
3. **Update** `auth-config.ts` to read from environment:

```typescript
export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'demo') as 'demo' | 'supabase';
```

## **🔧 What Changes When You Switch**

### **Demo Mode (`AUTH_MODE = 'demo')**
- Simple username + acknowledgment
- localStorage sessions (24-hour expiry)
- No external dependencies
- Perfect for presentations

### **Production Mode (`AUTH_MODE = 'supabase')**
- Email + password authentication
- User profiles and company info
- Database storage with RLS
- Wallet connection management
- Professional institutional features

## **📱 Demo Mode Features**

- **Instant access** - no setup required
- **Username customization** - users pick their name
- **Session persistence** - stays logged in during demo
- **Professional UI** - looks like production
- **No backend** - works offline

## **🏢 Production Mode Features**

- **User management** - real accounts
- **Data persistence** - database storage
- **Security** - email verification, password policies
- **Scalability** - enterprise-ready
- **Analytics** - user tracking and insights

## **🔄 Switching Back and Forth**

You can easily switch between modes:

1. **For demos**: Set `AUTH_MODE = 'demo'`
2. **For development**: Set `AUTH_MODE = 'supabase'`
3. **For production**: Set `AUTH_MODE = 'supabase'` + configure Supabase

## **💡 Best Practices**

- **Development**: Use demo mode for quick testing
- **Client demos**: Use demo mode for presentations
- **Production**: Use Supabase mode for real users
- **Testing**: Switch between modes to test both flows

---

**Your platform now supports both demo and production modes seamlessly!** 🎉

**Current mode: DEMO** - Perfect for showcasing your DeFi terminal! 🚀
