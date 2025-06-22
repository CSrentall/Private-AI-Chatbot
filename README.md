
# CSrental AI - Verbeterde Secure Chatbot Platform

## 🚀 Overzicht

CSrental AI is een geavanceerde, beveiligde AI chatbot platform speciaal ontwikkeld voor CSrental. Het platform biedt twee gespecialiseerde AI assistenten:

- **CeeS** - Technische kennis chatbot voor monteurs en technici
- **ChriS** - Inkoop AI chatbot voor efficiënte inkoopbeslissingen

### ✨ Nieuwe Features in v2.0

- 🔐 **Enterprise Security**: 2FA, IP whitelisting, rate limiting
- 👨‍💼 **Admin Dashboard**: Document approval workflow
- 📊 **Audit Logging**: Uitgebreide security en compliance logging
- 🔄 **RAG Pipeline**: Automatische document verwerking na approval
- 📱 **Responsive Design**: Optimaal voor desktop en mobiel
- ⚡ **Performance**: Verbeterde caching en optimalisaties

## 🏗️ Architectuur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   Next.js 14    │◄──►│   API Routes    │◄──►│   Supabase      │
│   TypeScript    │    │   Middleware    │    │   PostgreSQL    │
│   Tailwind CSS  │    │   Rate Limiting │    │   Auth & Storage│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Services   │    │   Security      │    │   Monitoring    │
│   OpenAI GPT-4  │    │   2FA & Audit   │    │   Logs & Stats  │
│   RAG Pipeline  │    │   IP Filtering  │    │   Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Technische Stack

### Frontend
- **Next.js 14** - React framework met App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **Supabase** - Backend-as-a-Service
- **OpenAI API** - GPT-4 integration
- **Speakeasy** - 2FA TOTP implementation

### Security
- **Two-Factor Authentication** - TOTP with backup codes
- **IP Whitelisting** - Network-level access control
- **Rate Limiting** - API abuse prevention
- **Audit Logging** - Comprehensive security logging
- **Helmet.js** - Security headers
- **JWT** - Secure token management

### Database
- **PostgreSQL** - Primary database via Supabase
- **Supabase Storage** - File storage for documents
- **Vector Embeddings** - For RAG similarity search

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd csrental-improved

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### 2. Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Security
JWT_SECRET=your_jwt_secret_key_here
NEXTAUTH_SECRET=your_nextauth_secret
ALLOWED_IPS=127.0.0.1,::1,your_office_ip

# 2FA
TOTP_ISSUER=CSrental
TOTP_WINDOW=2
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Seed database
npm run db:seed
```

### 4. Development

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

## 📋 Features

### 🤖 AI Chatbots

#### CeeS (Technische Assistent)
- Technische vragen beantwoorden
- Installatiehandleidingen
- Troubleshooting ondersteuning
- Veiligheidsinstructies
- Technische specificaties

#### ChriS (Inkoop Assistent)
- Prijsvergelijkingen
- Leveranciersinformatie
- Kostenanalyses
- Inkoopadvies
- Contractvoorwaarden

### 🔐 Security Features

#### Two-Factor Authentication
- TOTP authenticator app support
- Backup codes voor recovery
- Verplicht voor admin accounts
- QR code setup wizard

#### Access Control
- IP whitelisting middleware
- Role-based permissions (USER/ADMIN/SUPER_ADMIN)
- Session management
- Automatic logout

#### Rate Limiting
- API endpoint protection
- Configurable limits per endpoint type
- Redis support voor production
- Graceful degradation

#### Audit Logging
- Comprehensive security event logging
- User action tracking
- Failed login attempts
- Document access logs
- Admin activity monitoring

### 👨‍💼 Admin Dashboard

#### Document Management
- Upload approval workflow
- Bulk document actions
- Status tracking (PENDING/APPROVED/REJECTED)
- Automatic RAG processing na approval
- File type en size validation

#### User Management
- User role assignment
- 2FA status monitoring
- Activity tracking
- Account activation/deactivation

#### System Monitoring
- Real-time statistics
- Performance metrics
- Security event dashboard
- Usage analytics

### 📄 Document Processing

#### RAG Pipeline
- Automatic text extraction
- Intelligent chunking
- Vector embedding generation
- Similarity search
- Source attribution in responses

#### Supported Formats
- PDF documents
- Microsoft Word (DOC/DOCX)
- Plain text (TXT)
- Markdown (MD)

## 🔒 Security Implementation

### Middleware Security Stack

```typescript
// IP Whitelisting
if (!isIPAllowed(clientIP)) {
  return new NextResponse('Access Denied', { status: 403 })
}

// Rate Limiting
const rateLimitResult = await rateLimit(clientIP)
if (!rateLimitResult.success) {
  return new NextResponse('Too Many Requests', { status: 429 })
}

// 2FA Enforcement
if (isAdminRoute && !user.twoFactorEnabled) {
  return NextResponse.redirect('/auth/setup-2fa')
}
```

### Database Security

```sql
-- Row Level Security (RLS) policies
CREATE POLICY "Users can only see own data" ON documents_metadata
  FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can see all data" ON documents_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );
```

## 📊 API Documentation

### Authentication Endpoints

```typescript
POST /api/auth/setup-2fa
// Setup 2FA for user account
// Returns: QR code URL and backup codes

PUT /api/auth/setup-2fa
// Enable 2FA with verification
// Body: { secret, token, backupCodes }

POST /api/auth/verify-2fa
// Verify 2FA token
// Body: { token }
```

### Chat Endpoints

```typescript
POST /api/chat
// Send chat message
// Body: { message, sessionId?, mode }
// Returns: { response, sessionId, sources? }
```

### Document Endpoints

```typescript
POST /api/documents/upload
// Upload document for approval
// Body: FormData with file
// Returns: { success, document }

GET /api/documents/upload
// Get user's uploaded documents
// Returns: { documents }
```

### Admin Endpoints

```typescript
GET /api/admin/documents
// Get documents for approval
// Query: ?status=PENDING&page=1&limit=20

POST /api/admin/documents/[id]/approve
// Approve document
// Body: { reason? }

POST /api/admin/documents/[id]/reject
// Reject document
// Body: { reason }

GET /api/admin/stats
// Get admin dashboard statistics
```

## 🚀 Deployment

### Production Environment

```bash
# Build application
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel --prod
```

### Environment Configuration

```env
# Production settings
NODE_ENV=production
ENABLE_AUDIT_LOGGING=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Redis for rate limiting (recommended)
REDIS_URL=redis://your-redis-instance

# Monitoring
LOG_LEVEL=info
```

### Security Checklist

- [ ] Environment variables configured
- [ ] IP whitelist updated voor production
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring alerts setup
- [ ] 2FA enabled voor alle admin accounts
- [ ] Rate limits tested
- [ ] Audit logging verified

## 🔧 Development

### Code Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── AdminDashboard.tsx
│   ├── ChatInterface.tsx
│   └── DocumentUpload.tsx
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Database client
│   ├── openai.ts         # AI service
│   ├── two-factor.ts     # 2FA implementation
│   ├── rate-limit.ts     # Rate limiting
│   └── audit-logger.ts   # Security logging
├── types/                 # TypeScript definitions
└── middleware.ts          # Request middleware
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Create migration
npm run db:migrate

# Reset database (development only)
npx prisma db reset
```

## 📈 Monitoring & Analytics

### Performance Metrics
- API response times
- Database query performance
- File upload speeds
- Chat response latency

### Security Metrics
- Failed login attempts
- Rate limit violations
- IP access patterns
- 2FA usage statistics

### Usage Analytics
- Active users per day/week/month
- Chat sessions per mode (CeeS vs ChriS)
- Document upload/approval rates
- Feature adoption metrics

## 🐛 Troubleshooting

### Common Issues

#### 2FA Setup Problems
```bash
# Check TOTP configuration
echo $TOTP_ISSUER
echo $TOTP_WINDOW

# Verify time synchronization
ntpdate -s time.nist.gov
```

#### Rate Limiting Issues
```bash
# Check Redis connection
redis-cli ping

# Clear rate limit cache
redis-cli FLUSHDB
```

#### Database Connection
```bash
# Test database connection
npx prisma db pull

# Check Supabase status
curl -I https://your-project.supabase.co/rest/v1/
```

### Logs & Debugging

```bash
# View application logs
tail -f logs/application.log

# Check audit logs
tail -f logs/audit.log

# Database logs
tail -f logs/database.log
```

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit pull request

### Code Standards

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits

## 📞 Support

### Internal Support
- **IT Team**: it@csrental.nl
- **Admin Issues**: admin@csrental.nl
- **Security Concerns**: security@csrental.nl

### Documentation
- [API Documentation](./docs/api.md)
- [Security Guide](./docs/security.md)
- [Deployment Guide](./docs/deployment.md)
- [User Manual](./docs/user-guide.md)

## 📄 License

Proprietary software voor CSrental. Alle rechten voorbehouden.

---

**Versie**: 2.0.0  
**Laatste Update**: 21 juni 2025  
**Ontwikkeld door**: CSrental IT Team met Abacus.AI
