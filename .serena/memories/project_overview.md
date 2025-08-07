# Enhanced Eventify App - Project Overview

## Purpose
A React Native event discovery and management application that allows users to explore events in their area, manage their profiles, and interact with venue listings on an interactive map.

## Tech Stack
- **Frontend**: React Native 0.79.5 with Expo
- **Language**: TypeScript (strict mode enabled)
- **State Management**: MobX State Tree (MST)
- **Navigation**: React Navigation v7 (Bottom Tabs + Material Top Tabs)
- **Backend**: Supabase (PostgreSQL with real-time features)
- **Maps**: @rnmapbox/maps for interactive mapping
- **Testing**: Jest with React Native Testing Library + Maestro for E2E
- **Internationalization**: i18next (Turkish/English)
- **Package Manager**: bun (Node.js >=20.0.0)

## Key Features
- Event listing and discovery
- Interactive map with venue pins
- User profile management
- Business profile management
- Multi-language support (TR/EN)
- Cross-platform (iOS, Android, Web)

## Project Structure
```
app/
├── components/     # Reusable UI components
├── screens/        # Screen components  
├── stores/         # MobX State Tree stores
├── services/       # API and business logic
├── navigators/     # Navigation configuration
├── theme/          # Theming and styling system
├── i18n/          # Translation files
├── models/        # Data model definitions
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```