import React from 'react';
import {
  BrandedLoadingPanel,
  type BrandedLoadingPanelProps,
} from '@/components/common/BrandedLoadingPanel';
import { TELEHEALTH_LOADING } from './telehealthLoadingCopy';

export type TelehealthLoadingPanelProps = Omit<BrandedLoadingPanelProps, 'title'> & {
  title?: string;
};

export function TelehealthLoadingPanel({
  title = TELEHEALTH_LOADING.title,
  ...rest
}: TelehealthLoadingPanelProps) {
  return <BrandedLoadingPanel title={title} {...rest} />;
}
