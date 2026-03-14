import type {
  LucideIcon,
} from 'lucide-react'
import {
  File,
  Bug,
  RotateCw,
  Ban,
  Rocket,
  Smartphone,
  Zap,
  Plane,
  Bell,
  Lock,
  Target,
  Check,
  AlertTriangle,
  Scale,
  Mic,
  Briefcase,
  Music,
  ClipboardList,
  Heart,
  Brain,
  BarChart3,
  TrendingUp,
  Search,
  Clipboard,
  Image,
  Volume2,
  Box,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Mail,
  MessageSquare,
  Users,
  HardDrive,
  Settings,
  Hand,
  FolderOpen,
  User,
  PartyPopper,
  Eye,
  FileText,
} from 'lucide-react'

// Emoji to Icon mapping
export const EMOJI_TO_ICON: Record<string, LucideIcon> = {
  // General
  '📄': File,
  '📄 ': File,
  '📋': Clipboard,
  '📰': FileText,
  
  // Features & Status
  '🦴': Bug, // Using Bug as skeleton alternative
  '🔄': RotateCw,
  '📵': Ban,
  '🚀': Rocket,
  
  // Communication & Devices
  '📱': Smartphone,
  '⚡': Zap,
  '📴': Plane,
  '🔔': Bell,
  '🔒': Lock,
  
  // Analysis & Data
  '🎯': Target,
  '✓': Check,
  '⚠️': AlertTriangle,
  '⚖️': Scale,
  
  // Audio & Speech
  '🎤': Mic,
  '🎙️': Mic,
  '💼': Briefcase,
  '🎵': Music,
  
  // Thinking & Analysis
  '📝': ClipboardList,
  '💭': Heart,
  '🧠': Brain,
  
  // Charts & Metrics
  '📊': BarChart3,
  '📈': TrendingUp,
  '📉': TrendingDown,
  
  // Search & Discovery
  '🔍': Search,
  
  // Document & Media
  '🖼️': Image,
  '🔊': Volume2,
  '📦': Box,
  
  // Navigation
  '➡️': ArrowRight,
  '🔮': Sparkles,
  
  // UI & Admin
  '📧': Mail,
  '💬': MessageSquare,
  '👥': Users,
  '💾': HardDrive,
  '⚙️': Settings,
  
  // Gestures & Interactions
  '👋': Hand,
  '👁️': Eye,
  '📁': FolderOpen,
  '👤': User,
  
  // Special
  '🎉': PartyPopper,
}

// Function to get icon component from emoji
export const getIconComponent = (emoji: string): LucideIcon => {
  return EMOJI_TO_ICON[emoji] || File // Default to File icon
}

// Custom names for different contexts
export const ICON_NAMES = {
  PAGINATION: 'FILE',
  SKELETON: 'BUG',
  ERROR_RECOVERY: 'ROTATE_CW',
  OFFLINE: 'BAN',
  PWA: 'ROCKET',
  INSTALLABLE: 'SMARTPHONE',
  FAST_LOADING: 'ZAP',
  OFFLINE_READY: 'PLANE',
  PUSH_ALERTS: 'BELL',
  SECURE: 'LOCK',
  CREDIBILITY: 'TARGET',
  CONSISTENCY: 'CHECK',
  RISK: 'ALERT_TRIANGLE',
  CRIMINAL_MODE: 'SCALE',
  INTERVIEW_MODE: 'MIC',
  BUSINESS_MODE: 'BRIEFCASE',
  AUDIO: 'MUSIC',
  TRANSCRIPTS: 'CLIPBOARD_LIST',
  SENTIMENT: 'HEART',
  KEY_INSIGHTS: 'TARGET',
  ANALYSIS: 'BRAIN',
  REPORT: 'BAR_CHART_3',
  PRIMARY_STRENGTH: 'TARGET',
  ENGAGEMENT: 'TRENDING_UP',
  CONSISTENCY_SCORE: 'SEARCH',
  NOTABLE_PATTERNS: 'ZAP',
  CASE_FILE: 'CLIPBOARD',
  EVIDENCE: 'IMAGE',
  AUDIO_RECORDS: 'VOLUME_2',
  DATA_ANALYSIS: 'BAR_CHART_3',
  EXTRACTION: 'BOX',
  METRICS: 'BAR_CHART_3',
  RECOMMENDATIONS: 'TARGET',
  FORECAST: 'SPARKLES',
  CRIMINAL_INVESTIGATION: 'SEARCH',
  INTERVIEW_PROCESSING: 'MIC',
  BUSINESS_REVIEW: 'BAR_CHART_3',
  EMAIL: 'MAIL',
  PHONE: 'SMARTPHONE',
  CHAT: 'MESSAGE_SQUARE',
  DASHBOARD: 'BAR_CHART_3',
  USERS_ADMIN: 'USERS',
  LOGS: 'SEARCH',
  BACKUPS: 'HARD_DRIVE',
  SETTINGS_ADMIN: 'SETTINGS',
  WELCOME: 'HAND',
  UPLOAD: 'FOLDER_OPEN',
  PROFILE: 'USER',
  COMPLETE: 'PARTY_POPPER',
  PASSWORD_SHOW: 'EYE',
  PASSWORD_HIDE: 'LOCK',
} as const
