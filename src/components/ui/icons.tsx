'use client';

import type { CSSProperties, ComponentType } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowLeft,
  faArrowRight,
  faArrowRotateLeft,
  faArrowRotateRight,
  faArrowsLeftRight,
  faArrowsUpDown,
  faArrowsUpDownLeftRight,
  faBars,
  faBell,
  faBellSlash,
  faBookmark,
  faCalendarDays,
  faChartLine,
  faCheck,
  faChevronDown,
  faChevronRight,
  faChevronUp,
  faCircle,
  faCircleCheck,
  faCircleQuestion,
  faClock,
  faCode,
  faComment,
  faCompress,
  faCopy,
  faCrown,
  faDesktop,
  faDownload,
  faEllipsis,
  faEnvelope,
  faEnvelopeOpen,
  faEraser,
  faExpand,
  faEye,
  faEyeDropper,
  faEyeSlash,
  faFileImage,
  faFillDrip,
  faFloppyDisk,
  faGear,
  faGlobe,
  faGrip,
  faHeart,
  faHouse,
  faInbox,
  faLink,
  faLocationDot,
  faLock,
  faMagnifyingGlass,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faMessage,
  faMinus,
  faMoon,
  faPaintBrush,
  faPalette,
  faPaperPlane,
  faPencil,
  faPlus,
  faRetweet,
  faRightToBracket,
  faShareNodes,
  faShieldHalved,
  faSpinner,
  faSquare,
  faStar,
  faSun,
  faTableCellsLarge,
  faTrashCan,
  faTrophy,
  faUpload,
  faUser,
  faUserCheck,
  faUserPlus,
  faUsers,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons';

export interface IconProps {
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  role?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  strokeWidth?: number;
}

export type LucideIcon = ComponentType<IconProps>;

function icon(definition: IconDefinition): LucideIcon {
  function FontAwesomeAppIcon({ size, className, style, strokeWidth, ...props }: IconProps) {
    void strokeWidth;
    const dimension = typeof size === 'number' ? `${size}px` : size;
    return (
      <FontAwesomeIcon
        icon={definition}
        className={className}
        style={{
          ...(dimension ? { width: dimension, height: dimension } : null),
          ...style,
        }}
        {...props}
      />
    );
  }
  return FontAwesomeAppIcon;
}

export const ArrowLeft = icon(faArrowLeft);
export const ArrowRight = icon(faArrowRight);
export const BadgeCheck = icon(faCircleCheck);
export const Bell = icon(faBell);
export const BellOff = icon(faBellSlash);
export const Bookmark = icon(faBookmark);
export const Calendar = icon(faCalendarDays);
export const CalendarClock = icon(faCalendarDays);
export const Check = icon(faCheck);
export const CheckCircle2 = icon(faCircleCheck);
export const ChevronDown = icon(faChevronDown);
export const ChevronRight = icon(faChevronRight);
export const ChevronUp = icon(faChevronUp);
export const Circle = icon(faCircle);
export const Clock = icon(faClock);
export const Code = icon(faCode);
export const Compass = icon(faGrip);
export const Copy = icon(faCopy);
export const Crown = icon(faCrown);
export const Download = icon(faDownload);
export const Eraser = icon(faEraser);
export const Eye = icon(faEye);
export const EyeOff = icon(faEyeSlash);
export const FileImage = icon(faFileImage);
export const FlipHorizontal = icon(faArrowsLeftRight);
export const FlipVertical = icon(faArrowsUpDown);
export const Globe = icon(faGlobe);
export const Google = icon(faGoogle);
export const Github = icon(faGithub);
export const Grid3X3 = icon(faTableCellsLarge);
export const Heart = icon(faHeart);
export const HelpCircle = icon(faCircleQuestion);
export const Home = icon(faHouse);
export const Image = icon(faFileImage);
export const Inbox = icon(faInbox);
export const LinkIcon = icon(faLink);
export const Loader2 = icon(faSpinner);
export const Lock = icon(faLock);
export const LockKeyhole = icon(faLock);
export const LogIn = icon(faRightToBracket);
export const Mail = icon(faEnvelope);
export const MailOpen = icon(faEnvelopeOpen);
export const MapPin = icon(faLocationDot);
export const Maximize2 = icon(faExpand);
export const Menu = icon(faBars);
export const MessageCircle = icon(faComment);
export const MessageSquare = icon(faMessage);
export const Minimize2 = icon(faCompress);
export const Minus = icon(faMinus);
export const Monitor = icon(faDesktop);
export const Moon = icon(faMoon);
export const MoreHorizontal = icon(faEllipsis);
export const Move = icon(faArrowsUpDownLeftRight);
export const PaintBucket = icon(faFillDrip);
export const Paintbrush = icon(faPaintBrush);
export const Palette = icon(faPalette);
export const Pencil = icon(faPencil);
export const Pipette = icon(faEyeDropper);
export const Plus = icon(faPlus);
export const Redo2 = icon(faArrowRotateRight);
export const Repeat = icon(faRetweet);
export const Repeat2 = icon(faRetweet);
export const RotateCcw = icon(faArrowRotateLeft);
export const RotateCw = icon(faArrowRotateRight);
export const Save = icon(faFloppyDisk);
export const Search = icon(faMagnifyingGlass);
export const Send = icon(faPaperPlane);
export const Settings = icon(faGear);
export const Share2 = icon(faShareNodes);
export const Shield = icon(faShieldHalved);
export const Sparkles = icon(faWandMagicSparkles);
export const Square = icon(faSquare);
export const Star = icon(faStar);
export const Sun = icon(faSun);
export const Trash2 = icon(faTrashCan);
export const TrendingUp = icon(faChartLine);
export const Trophy = icon(faTrophy);
export const Undo2 = icon(faArrowRotateLeft);
export const Upload = icon(faUpload);
export const User = icon(faUser);
export const UserCheck = icon(faUserCheck);
export const UserPlus = icon(faUserPlus);
export const Users = icon(faUsers);
export const X = icon(faXmark);
export const ZoomIn = icon(faMagnifyingGlassPlus);
export const ZoomOut = icon(faMagnifyingGlassMinus);
