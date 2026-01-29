import { useWindowDimensions } from 'react-native';
import { responsiveSize } from '@/utils/scaling';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isExtraSmall = width < 360;
  const isSmallDevice = width < 375;
  const isMediumDevice = width >= 375 && width < 768;
  const isLargeDevice = width >= 768;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  return {
    width,
    height,
    isExtraSmall,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    isLandscape,
    containerPadding: isExtraSmall ? responsiveSize.xs : isSmallDevice ? responsiveSize.sm : responsiveSize.md,
    columns: isTablet ? 2 : 1,
  };
};
