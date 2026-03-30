import { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { StyleProp, ViewStyle } from 'react-native';

export interface TelehealthWebViewProps {
  url: string;
  memberId: string;
  initialUrl?: string;
  style?: StyleProp<ViewStyle>;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  onFormStateChange?: (hasUnsavedData: boolean) => void;
  onFormSubmitSuccess?: () => void;
  onSessionExpired?: () => void;
  headers?: Record<string, string>;
  /** Message under the title while the WebView loads the first page (defaults to shared telehealth copy). */
  loadingSubtitle?: string;
}

export interface FormState {
  url: string;
  scrollPosition: { x: number; y: number };
  formData: Record<string, any>;
  timestamp: number;
  memberId: string;
}

export interface SavedFormState {
  key: string;
  state: FormState;
  savedAt: number;
}

export interface WebViewMessage {
  type: 'formStateChange' | 'formSubmit' | 'error' | 'freeze' | 'scroll' | 'consoleLog';
  data?: any;
  timestamp: number;
}
