# DROPIQ User Profile System

## Overview

This document describes the comprehensive user profile system implemented for the DROPIQ platform. The system provides a complete user experience with profiles, achievements, badges, strategies, and social features.

## Features Implemented

### 1. User Profile Management
- **Complete user profiles** with avatar, bio, reputation, level, and experience
- **Profile customization** with editable fields and preferences
- **Progress tracking** with visual indicators for level and experience
- **Social features** including followers/following system

### 2. Achievement System
- **Multiple achievement categories** (milestone, social, expert, etc.)
- **Progress tracking** for each achievement
- **Unlock system** with automatic experience rewards
- **Visual achievement display** with icons and rarity levels

### 3. Badge System
- **Various badge types** (automatic, manual, special)
- **Badge categories** (strategy, success, community, expert)
- **Rarity levels** (common, rare, epic, legendary)
- **Active/inactive badge management**

### 4. Strategy System
- **Strategy creation and sharing** with rich content
- **Strategy ratings and reviews** (1-5 star system)
- **Comment system** with likes and replies
- **Strategy metrics** (views, likes, shares, success rate)
- **Filtering and search** by category, difficulty, risk level
- **Trending strategies** display

### 5. Leaderboard System
- **Multiple ranking types** (reputation, earnings, achievements)
- **Time-based filtering** (week, month, all-time)
- **Rank change tracking** with visual indicators
- **Top performer highlights**

### 6. Progress Tracking
- **Task progress monitoring** with status updates
- **Reward tracking** for completed tasks
- **Visual progress bars** and completion percentages
- **Deadline management** for time-sensitive tasks

## Database Schema

### Core Models

#### User
- Extended with profile fields: username, avatar, bio, reputation, level, experience
- Social features: followers, following
- Preferences and settings storage

#### Achievement
- Name, title, description, icon
- Category and rarity system
- Point values and requirements
- Active/inactive status

#### UserAchievement
- Progress tracking (0-100)
- Unlock status and timestamps
- Metadata for achievement-specific data

#### Badge
- Name, title, description, icon
- Type, category, and rarity
- Requirements and benefits
- Active status management

#### Strategy
- Rich content with title, description, and detailed steps
- Category, difficulty, and risk level classification
- Metrics: views, likes, shares, success rate
- Author information and verification status

#### StrategyComment
- Comment content with likes
- User information and timestamps
- Edit tracking and deletion support

#### StrategyRating
- 1-5 star rating system
- Optional review text
- User and strategy association

#### UserFollows
- Follower/following relationships
- Timestamp tracking
- Unique constraint prevention

## API Endpoints

### User Profile
- `GET /api/user/profile?userId={id}` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Achievements
- `POST /api/user/achievements` - Unlock achievement
- `GET /api/achievements` - Get all achievements

### Leaderboard
- `GET /api/user/leaderboard?type={type}&limit={limit}` - Get leaderboard

### Following
- `POST /api/user/follow` - Follow user
- `DELETE /api/user/follow` - Unfollow user

### Strategies
- `GET /api/strategies` - Get strategies with filtering
- `POST /api/strategies` - Create strategy
- `GET /api/strategies/{id}` - Get single strategy
- `PUT /api/strategies/{id}` - Update strategy
- `DELETE /api/strategies/{id}` - Delete strategy
- `POST /api/strategies/{id}/like` - Like/unlike strategy
- `POST /api/strategies/{id}/comments` - Add comment
- `POST /api/strategies/{id}/rating` - Rate strategy
- `GET /api/strategies/trending` - Get trending strategies

### Progress
- `GET /api/user/progress?userId={id}` - Get user progress

## Frontend Components

### React Query Hooks
- `useUserProfile` - Profile data management
- `useAchievements` - Achievement system
- `useStrategies` - Strategy management
- `useLeaderboard` - Leaderboard data
- `useFollow` - Social following

### Pages
- `/profile` - User profile page with tabs
- `/strategies` - Strategy browsing and management
- `/leaderboard` - Leaderboard with multiple views

### UI Components
- Profile cards with user information
- Achievement displays with progress bars
- Strategy cards with metrics
- Leaderboard tables with rankings
- Progress tracking components

## Technical Implementation

### Services
- `UserProfileService` - Core profile operations
- `StrategyService` - Strategy management
- Comprehensive error handling and validation
- Database transaction management

### Type Safety
- Complete TypeScript definitions
- Interface-based architecture
- Type-safe API responses
- Enum definitions for categories and statuses

### Performance
- Optimized database queries with proper indexing
- React Query caching for better UX
- Lazy loading for large datasets
- Efficient data fetching patterns

## Data Seeding

The system includes a comprehensive seeding script (`npm run db:seed`) that creates:
- Sample users with different reputation levels
- Various achievements and badges
- Example strategies with different categories
- User achievements and badge assignments
- Social relationships (followers)

## Security Considerations

- Input validation on all API endpoints
- SQL injection prevention through Prisma ORM
- Authorization checks for user actions
- Rate limiting considerations for API calls
- Data sanitization for user-generated content

## Future Enhancements

### Potential Features
- Real-time notifications for achievements
- Strategy recommendation system
- Advanced analytics and insights
- Social activity feeds
- Achievement sharing capabilities
- Gamification elements

### Scalability
- Database optimization for large user bases
- Caching strategies for better performance
- CDN integration for media assets
- Background job processing for achievements

## Conclusion

The DROPIQ User Profile System provides a comprehensive foundation for user engagement and social interaction within the platform. It combines gamification elements, social features, and content sharing to create an engaging user experience that encourages participation and community building.

The system is built with scalability, maintainability, and user experience in mind, following modern web development best practices and utilizing the latest technologies in the Next.js ecosystem.