import React from 'react';
import { VoyadoProviderOptions } from './states/GlobalActivation';
export declare const VoyadoContext: React.Context<{}>;
interface VoyadoProviderProps {
  children: React.ReactNode;
  options: VoyadoProviderOptions;
}
export declare const VoyadoProvider: (props: VoyadoProviderProps) => JSX.Element;
export declare function useGlobalActivationValues(): {};
export {};
