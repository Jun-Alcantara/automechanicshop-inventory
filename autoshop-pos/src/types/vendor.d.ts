// Shim for @expo/vector-icons — the package ships inside the `expo` umbrella
// bundle without standalone type declarations resolvable by tsc. This ambient
// declaration satisfies the compiler while preserving full runtime behaviour.

declare module '@expo/vector-icons' {
  import type React from 'react';
  import type { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export type IconComponent = React.FC<IconProps>;

  export const Ionicons: IconComponent;
  export const MaterialIcons: IconComponent;
  export const MaterialCommunityIcons: IconComponent;
  export const FontAwesome: IconComponent;
  export const FontAwesome5: IconComponent;
  export const Feather: IconComponent;
  export const AntDesign: IconComponent;
  export const Entypo: IconComponent;
  export const EvilIcons: IconComponent;
  export const Fontisto: IconComponent;
  export const Foundation: IconComponent;
  export const Octicons: IconComponent;
  export const SimpleLineIcons: IconComponent;
  export const Zocial: IconComponent;
}
