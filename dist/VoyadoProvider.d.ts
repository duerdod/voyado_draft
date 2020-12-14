import React from 'react';
import { VoyadoProviderSettings } from './states/GlobalActivation';
export declare const VoyadoContext: React.Context<{}>;
interface VoyadoProviderProps {
  children: React.ReactNode;
  settings: VoyadoProviderSettings;
}
export declare const VoyadoProvider: (props: VoyadoProviderProps) => JSX.Element;
export declare function useGlobalActivationValues(): {};
export {};
