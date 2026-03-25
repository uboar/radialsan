import React from 'react';
import { PieMenu } from './PieMenu/PieMenu';

export const Overlay: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'transparent',
      overflow: 'hidden',
    }}
  >
    <PieMenu />
  </div>
);

export default Overlay;
