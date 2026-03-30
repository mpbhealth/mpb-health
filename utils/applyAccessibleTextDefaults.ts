import { Text, TextInput, type TextProps, type TextInputProps } from 'react-native';
import { defaultAccessibleTextProps } from '@/constants/accessibility';

type TextWithLegacyDefaults = typeof Text & { defaultProps?: Partial<TextProps> };
type TextInputWithLegacyDefaults = typeof TextInput & { defaultProps?: Partial<TextInputProps> };

/** Call once at app startup (e.g. root layout module scope). RN still honors defaultProps on host Text. */
export function applyAccessibleTextDefaults() {
  const T = Text as TextWithLegacyDefaults;
  const TI = TextInput as TextInputWithLegacyDefaults;
  T.defaultProps = { ...T.defaultProps, ...defaultAccessibleTextProps };
  TI.defaultProps = { ...TI.defaultProps, ...defaultAccessibleTextProps };
}
