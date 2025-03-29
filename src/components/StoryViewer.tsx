import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, BookText, ArrowLeft, ArrowRight, Download, HelpCircle, Share2, Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Play, Pause, Volume2, Volume1, VolumeX, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from 'lucide-react';
import { useStoryNarration } from '@/hooks/useStoryNarration';
import { Progress } from "@/components/ui/progress";
import { generatePaperCutOut } from '@/lib/utils';
import { useScreenshot } from 'use-react-screenshot';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "@radix-ui/react-icons";
import { DateRange } from "react-day-picker";
import { useMediaQuery } from 'usehooks-ts';
import { AdminLink } from '@/components/AdminLink';
import { NarrationPlayer } from '@/components/NarrationPlayer';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface Story {
  id: string;
  title: string;
  author_id: string;
  pdf_url: string;
  cover_url: string;
  created_at: string;
  metadata: any;
}

const ensureValidVoiceType = (voiceType: any): 'male' | 'female' => {
  if (voiceType === 'male' || voiceType === 'female') {
    return voiceType;
  }
  return 'female'; // Default to female if invalid
};

const StoryViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHowToUseDialog, setShowHowToUseDialog] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPaperCutOut, setIsGeneratingPaperCutOut] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isGeneratingNarration, setIsGeneratingNarration] = useState(false);
  const [isGeneratingAllNarrations, setIsGeneratingAllNarrations] = useState(false);
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);
  const [isGeneratingAllImagesAndNarrations, setIsGeneratingAllImagesAndNarrations] = useState(false);
  const [isGeneratingAllImagesAndNarrationsProgress, setIsGeneratingAllImagesAndNarrationsProgress] = useState(0);
  const [isGeneratingAllImagesProgress, setIsGeneratingAllImagesProgress] = useState(0);
  const [isGeneratingAllNarrationsProgress, setIsGeneratingAllNarrationsProgress] = useState(0);
  const [isGeneratingCoverProgress, setIsGeneratingCoverProgress] = useState(0);
  const [isGeneratingPdfProgress, setIsGeneratingPdfProgress] = useState(0);
  const [isGeneratingPaperCutOutProgress, setIsGeneratingPaperCutOutProgress] = useState(0);
  const [isGeneratingNarrationProgress, setIsGeneratingNarrationProgress] = useState(0);
  const [isGeneratingAllProgress, setIsGeneratingAllProgress] = useState(0);
  const [isGeneratingAllImagesAndNarrationsTotalPages, setIsGeneratingAllImagesAndNarrationsTotalPages] = useState(0);
  const [isGeneratingAllImagesTotalPages, setIsGeneratingAllImagesTotalPages] = useState(0);
  const [isGeneratingAllNarrationsTotalPages, setIsGeneratingAllNarrationsTotalPages] = useState(0);
  const [isGeneratingAllTotalPages, setIsGeneratingAllTotalPages] = useState(0);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [storyTags, setStoryTags] = useState('');
  const [storyCreatedAt, setStoryCreatedAt] = useState('');
  const [storyUpdatedAt, setStoryUpdatedAt] = useState('');
  const [storyAuthorId, setStoryAuthorId] = useState('');
  const [storyCoverUrl, setStoryCoverUrl] = useState('');
  const [storyPdfUrl, setStoryPdfUrl] = useState('');
  const [storyStyle, setStoryStyle] = useState<StoryStyle>('papercraft');
  const [storyChildName, setStoryChildName] = useState('');
  const [storyChildAge, setStoryChildAge] = useState('');
  const [storyTheme, setStoryTheme] = useState('');
  const [storySetting, setStorySetting] = useState('');
  const [storyMoral, setStoryMoral] = useState('');
  const [storyLength, setStoryLength] = useState('');
  const [storyReadingLevel, setStoryReadingLevel] = useState('');
  const [storyLanguage, setStoryLanguage] = useState('');
  const [storyVoiceType, setStoryVoiceType] = useState<'male' | 'female'>('female');
  const [showNarration, setShowNarration] = useState(true);
  const [showImages, setShowImages] = useState(true);
  const [showText, setShowText] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingNarrationSingle, setIsGeneratingNarrationSingle] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedNarrationUrl, setGeneratedNarrationUrl] = useState<string | null>(null);
  const [isStoryOwner, setIsStoryOwner] = useState(false);
  const [isStoryPublic, setIsStoryPublic] = useState(false);
  const [isStoryPublicLoading, setIsLoadingPublicLoading] = useState(true);
  const [isStoryPublicError, setIsStoryPublicError] = useState<string | null>(null);
  const [isStoryPublicSuccess, setIsStoryPublicSuccess] = useState<boolean | null>(null);
  const [isStoryPublicMessage, setIsStoryPublicMessage] = useState<string | null>(null);
  const [isStoryPublicButtonLoading, setIsStoryPublicButtonLoading] = useState(false);
  const [isStoryPublicButtonDisabled, setIsStoryPublicButtonDisabled] = useState(false);
  const [isStoryPublicButtonText, setIsStoryPublicButtonText] = useState('Tornar Público');
  const [isStoryPublicButtonIcon, setIsStoryPublicButtonIcon] = useState(<Share2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonVariant, setIsStoryPublicButtonVariant] = useState('outline');
  const [isStoryPublicButtonSize, setIsStoryPublicButtonSize] = useState('sm');
  const [isStoryPublicButtonClassName, setIsStoryPublicButtonClassName] = useState('');
  const [isStoryPublicButtonType, setIsStoryPublicButtonType] = useState('button');
  const [isStoryPublicButtonForm, setIsStoryPublicButtonForm] = useState(undefined);
  const [isStoryPublicButtonAsChild, setIsStoryPublicButtonAsChild] = useState(false);
  const [isStoryPublicButtonLoadingIcon, setIsStoryPublicButtonLoadingIcon] = useState(<Loader2 className="h-4 w-4 mr-2 animate-spin" />);
  const [isStoryPublicButtonSuccessIcon, setIsStoryPublicButtonSuccessIcon] = useState(<CheckCircle className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonErrorIcon, setIsStoryPublicButtonErrorIcon] = useState(<XCircle className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonAlertIcon, setIsStoryPublicButtonAlertIcon] = useState(<AlertTriangle className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonEyeIcon, setIsStoryPublicButtonEyeIcon] = useState(<Eye className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonEyeOffIcon, setIsStoryPublicButtonEyeOffIcon] = useState(<EyeOff className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonRefreshIcon, setIsStoryPublicButtonRefreshIcon] = useState(<RefreshCw className="h-4 w-4 mr-2 animate-spin" />);
  const [isStoryPublicButtonShareIcon, setIsStoryPublicButtonShareIcon] = useState(<Share2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonEditIcon, setIsStoryPublicButtonEditIcon] = useState(<Edit className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonBookTextIcon, setIsStoryPublicButtonBookTextIcon] = useState(<BookText className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonDownloadIcon, setIsStoryPublicButtonDownloadIcon] = useState(<Download className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonHelpCircleIcon, setIsStoryPublicButtonHelpCircleIcon] = useState(<HelpCircle className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonMoreVerticalIcon, setIsStoryPublicButtonMoreVerticalIcon] = useState(<MoreVertical className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonAdminLinkIcon, setIsStoryPublicButtonAdminLinkIcon] = useState(<Shield className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerIcon, setIsStoryPublicButtonNarrationPlayerIcon] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerPlayIcon, setIsStoryPublicButtonNarrationPlayerPlayIcon] = useState(<Play className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerPauseIcon, setIsStoryPublicButtonNarrationPlayerPauseIcon] = useState(<Pause className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeIcon, setIsStoryPublicButtonNarrationPlayerVolumeIcon] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon, setIsStoryPublicButtonNarrationPlayerVolumeXIcon] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon, setIsStoryPublicButtonNarrationPlayerVolume1Icon] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon2, setIsStoryPublicButtonNarrationPlayerVolume2Icon2] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon2, setIsStoryPublicButtonNarrationPlayerVolumeXIcon2] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon2, setIsStoryPublicButtonNarrationPlayerVolume1Icon2] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon3, setIsStoryPublicButtonNarrationPlayerVolume2Icon3] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon3, setIsStoryPublicButtonNarrationPlayerVolumeXIcon3] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon3, setIsStoryPublicButtonNarrationPlayerVolume1Icon3] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon4, setIsStoryPublicButtonNarrationPlayerVolume2Icon4] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon4, setIsStoryPublicButtonNarrationPlayerVolumeXIcon4] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon4, setIsStoryPublicButtonNarrationPlayerVolume1Icon4] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon5, setIsStoryPublicButtonNarrationPlayerVolume2Icon5] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon5, setIsStoryPublicButtonNarrationPlayerVolumeXIcon5] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon5, setIsStoryPublicButtonNarrationPlayerVolume1Icon5] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon6, setIsStoryPublicButtonNarrationPlayerVolume2Icon6] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon6, setIsStoryPublicButtonNarrationPlayerVolumeXIcon6] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon6, setIsStoryPublicButtonNarrationPlayerVolume1Icon6] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon7, setIsStoryPublicButtonNarrationPlayerVolume2Icon7] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon7, setIsStoryPublicButtonNarrationPlayerVolumeXIcon7] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon7, setIsStoryPublicButtonNarrationPlayerVolume1Icon7] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon8, setIsStoryPublicButtonNarrationPlayerVolume2Icon8] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon8, setIsStoryPublicButtonNarrationPlayerVolumeXIcon8] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon8, setIsStoryPublicButtonNarrationPlayerVolume1Icon8] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon9, setIsStoryPublicButtonNarrationPlayerVolume2Icon9] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon9, setIsStoryPublicButtonNarrationPlayerVolumeXIcon9] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon9, setIsStoryPublicButtonNarrationPlayerVolume1Icon9] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon10, setIsStoryPublicButtonNarrationPlayerVolume2Icon10] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon10, setIsStoryPublicButtonNarrationPlayerVolumeXIcon10] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon10, setIsStoryPublicButtonNarrationPlayerVolume1Icon10] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon11, setIsStoryPublicButtonNarrationPlayerVolume2Icon11] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon11, setIsStoryPublicButtonNarrationPlayerVolumeXIcon11] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon11, setIsStoryPublicButtonNarrationPlayerVolume1Icon11] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon12, setIsStoryPublicButtonNarrationPlayerVolume2Icon12] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon12, setIsStoryPublicButtonNarrationPlayerVolumeXIcon12] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon12, setIsStoryPublicButtonNarrationPlayerVolume1Icon12] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon13, setIsStoryPublicButtonNarrationPlayerVolume2Icon13] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon13, setIsStoryPublicButtonNarrationPlayerVolumeXIcon13] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon13, setIsStoryPublicButtonNarrationPlayerVolume1Icon13] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon14, setIsStoryPublicButtonNarrationPlayerVolume2Icon14] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon14, setIsStoryPublicButtonNarrationPlayerVolumeXIcon14] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon14, setIsStoryPublicButtonNarrationPlayerVolume1Icon14] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon15, setIsStoryPublicButtonNarrationPlayerVolume2Icon15] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon15, setIsStoryPublicButtonNarrationPlayerVolumeXIcon15] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon15, setIsStoryPublicButtonNarrationPlayerVolume1Icon15] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon16, setIsStoryPublicButtonNarrationPlayerVolume2Icon16] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon16, setIsStoryPublicButtonNarrationPlayerVolumeXIcon16] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon16, setIsStoryPublicButtonNarrationPlayerVolume1Icon16] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon17, setIsStoryPublicButtonNarrationPlayerVolume2Icon17] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon17, setIsStoryPublicButtonNarrationPlayerVolumeXIcon17] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon17, setIsStoryPublicButtonNarrationPlayerVolume1Icon17] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon18, setIsStoryPublicButtonNarrationPlayerVolume2Icon18] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon18, setIsStoryPublicButtonNarrationPlayerVolumeXIcon18] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon18, setIsStoryPublicButtonNarrationPlayerVolume1Icon18] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon19, setIsStoryPublicButtonNarrationPlayerVolume2Icon19] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon19, setIsStoryPublicButtonNarrationPlayerVolumeXIcon19] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon19, setIsStoryPublicButtonNarrationPlayerVolume1Icon19] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon20, setIsStoryPublicButtonNarrationPlayerVolume2Icon20] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon20, setIsStoryPublicButtonNarrationPlayerVolumeXIcon20] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon20, setIsStoryPublicButtonNarrationPlayerVolume1Icon20] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon21, setIsStoryPublicButtonNarrationPlayerVolume2Icon21] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon21, setIsStoryPublicButtonNarrationPlayerVolumeXIcon21] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon21, setIsStoryPublicButtonNarrationPlayerVolume1Icon21] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon22, setIsStoryPublicButtonNarrationPlayerVolume2Icon22] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon22, setIsStoryPublicButtonNarrationPlayerVolumeXIcon22] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon22, setIsStoryPublicButtonNarrationPlayerVolume1Icon22] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon23, setIsStoryPublicButtonNarrationPlayerVolume2Icon23] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon23, setIsStoryPublicButtonNarrationPlayerVolumeXIcon23] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon23, setIsStoryPublicButtonNarrationPlayerVolume1Icon23] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon24, setIsStoryPublicButtonNarrationPlayerVolume2Icon24] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon24, setIsStoryPublicButtonNarrationPlayerVolumeXIcon24] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon24, setIsStoryPublicButtonNarrationPlayerVolume1Icon24] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon25, setIsStoryPublicButtonNarrationPlayerVolume2Icon25] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon25, setIsStoryPublicButtonNarrationPlayerVolumeXIcon25] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon25, setIsStoryPublicButtonNarrationPlayerVolume1Icon25] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon26, setIsStoryPublicButtonNarrationPlayerVolume2Icon26] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon26, setIsStoryPublicButtonNarrationPlayerVolumeXIcon26] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon26, setIsStoryPublicButtonNarrationPlayerVolume1Icon26] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon27, setIsStoryPublicButtonNarrationPlayerVolume2Icon27] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon27, setIsStoryPublicButtonNarrationPlayerVolumeXIcon27] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon27, setIsStoryPublicButtonNarrationPlayerVolume1Icon27] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon28, setIsStoryPublicButtonNarrationPlayerVolume2Icon28] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon28, setIsStoryPublicButtonNarrationPlayerVolumeXIcon28] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon28, setIsStoryPublicButtonNarrationPlayerVolume1Icon28] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon29, setIsStoryPublicButtonNarrationPlayerVolume2Icon29] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon29, setIsStoryPublicButtonNarrationPlayerVolumeXIcon29] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon29, setIsStoryPublicButtonNarrationPlayerVolume1Icon29] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon30, setIsStoryPublicButtonNarrationPlayerVolume2Icon30] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon30, setIsStoryPublicButtonNarrationPlayerVolumeXIcon30] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon30, setIsStoryPublicButtonNarrationPlayerVolume1Icon30] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon31, setIsStoryPublicButtonNarrationPlayerVolume2Icon31] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon31, setIsStoryPublicButtonNarrationPlayerVolumeXIcon31] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon31, setIsStoryPublicButtonNarrationPlayerVolume1Icon31] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon32, setIsStoryPublicButtonNarrationPlayerVolume2Icon32] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon32, setIsStoryPublicButtonNarrationPlayerVolumeXIcon32] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon32, setIsStoryPublicButtonNarrationPlayerVolume1Icon32] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon33, setIsStoryPublicButtonNarrationPlayerVolume2Icon33] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon33, setIsStoryPublicButtonNarrationPlayerVolumeXIcon33] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon33, setIsStoryPublicButtonNarrationPlayerVolume1Icon33] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon34, setIsStoryPublicButtonNarrationPlayerVolume2Icon34] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon34, setIsStoryPublicButtonNarrationPlayerVolumeXIcon34] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon34, setIsStoryPublicButtonNarrationPlayerVolume1Icon34] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon35, setIsStoryPublicButtonNarrationPlayerVolume2Icon35] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon35, setIsStoryPublicButtonNarrationPlayerVolumeXIcon35] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon35, setIsStoryPublicButtonNarrationPlayerVolume1Icon35] = useState(<Volume1 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume2Icon36, setIsStoryPublicButtonNarrationPlayerVolume2Icon36] = useState(<Volume2 className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolumeXIcon36, setIsStoryPublicButtonNarrationPlayerVolumeXIcon36] = useState(<VolumeX className="h-4 w-4 mr-2" />);
  const [isStoryPublicButtonNarrationPlayerVolume1Icon36, setIsStoryPublicButtonNarrationPlayerVolume1Icon36] = useState(<Volume1 className="h-4 w-4 mr-2" />);

  return (
    <div>
      <p>Story Viewer Component</p>
    </div>
  );
};

export default StoryViewer;
