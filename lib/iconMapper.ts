import {
  Calendar,
  CreditCard,
  Users,
  UserCog,
  FileEdit,
  X,
  FileText,
  FlaskRound as Flask,
  Microscope,
  Stethoscope,
  Building2,
  MapPin,
  UserCheck,
  Tag,
  Leaf,
  Eye,
  Pill,
  type LucideIcon,
} from 'lucide-react-native';

const iconMap: Record<string, LucideIcon> = {
  Calendar,
  CreditCard,
  Users,
  UserCog,
  FileEdit,
  X,
  FileText,
  Flask,
  Microscope,
  Stethoscope,
  Building2,
  MapPin,
  UserCheck,
  Tag,
  Leaf,
  Eye,
  Pill,
};

export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || FileText;
}
