import React, { useContext } from 'react';
// import { SignupContext } from '@jetshop/core/components/Auth/signup-context';
import ChannelContext from '@jetshop/core/components/ChannelContext';

export const Signup = ({ children }): any => {
  const { selectedChannel } = useContext(ChannelContext);
  return <h1>{children}</h1>;
};
