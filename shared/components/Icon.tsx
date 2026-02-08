
import React from 'react';
import {
  FileText, BookOpen, Target, Edit3, Book, Settings, Home,
  ArrowLeft, ChevronLeft, ArrowRight, ChevronRight, Plus, X,
  Check, Search, Upload, Share, BarChart3, Clock, Shuffle,
  Trash2, Pencil, ClipboardList, Play, Pause, Save, Folder,
  Lock, Eye, EyeOff, AlertTriangle, Info, XCircle, CheckCircle,
  PartyPopper, Sparkles, MoreVertical, LayoutGrid, List,
  Printer, LogOut, RefreshCw, Download
} from 'lucide-react';

export type IconName = 
  | 'file-text' | 'book-open' | 'target' | 'edit-3' | 'book' 
  | 'settings' | 'home' | 'arrow-left' | 'chevron-left' 
  | 'arrow-right' | 'chevron-right' | 'plus' | 'x' | 'check' 
  | 'search' | 'upload' | 'share' | 'bar-chart-3' | 'clock' 
  | 'shuffle' | 'trash-2' | 'pencil' | 'clipboard-list' 
  | 'play' | 'pause' | 'save' | 'folder' | 'lock' | 'eye' 
  | 'eye-off' | 'alert-triangle' | 'info' | 'x-circle' 
  | 'check-circle' | 'party-popper' | 'sparkles' | 'more-vertical'
  | 'layout-grid' | 'list' | 'printer' | 'log-out' | 'refresh-cw'
  | 'download';

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: string;
  className?: string;
  strokeWidth?: number;
}

const iconMap: Record<IconName, React.ElementType> = {
  'file-text': FileText,
  'book-open': BookOpen,
  'target': Target,
  'edit-3': Edit3,
  'book': Book,
  'settings': Settings,
  'home': Home,
  'arrow-left': ArrowLeft,
  'chevron-left': ChevronLeft,
  'arrow-right': ArrowRight,
  'chevron-right': ChevronRight,
  'plus': Plus,
  'x': X,
  'check': Check,
  'search': Search,
  'upload': Upload,
  'share': Share,
  'bar-chart-3': BarChart3,
  'clock': Clock,
  'shuffle': Shuffle,
  'trash-2': Trash2,
  'pencil': Pencil,
  'clipboard-list': ClipboardList,
  'play': Play,
  'pause': Pause,
  'save': Save,
  'folder': Folder,
  'lock': Lock,
  'eye': Eye,
  'eye-off': EyeOff,
  'alert-triangle': AlertTriangle,
  'info': Info,
  'x-circle': XCircle,
  'check-circle': CheckCircle,
  'party-popper': PartyPopper,
  'sparkles': Sparkles,
  'more-vertical': MoreVertical,
  'layout-grid': LayoutGrid,
  'list': List,
  'printer': Printer,
  'log-out': LogOut,
  'refresh-cw': RefreshCw,
  'download': Download
};

const sizeMap = {
  'sm': 16,
  'md': 20,
  'lg': 24,
  'xl': 32,
  '2xl': 48
};

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 'md', 
  color = 'currentColor', 
  className = '',
  strokeWidth = 2
}) => {
  const IconComponent = iconMap[name];
  const pixelSize = sizeMap[size];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent 
      size={pixelSize} 
      color={color} 
      strokeWidth={strokeWidth} 
      className={className} 
    />
  );
};

export default Icon;
