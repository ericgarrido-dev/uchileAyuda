// Genérico para cualquier otro set de íconos (opcional)
declare module 'react-native-vector-icons/*';

// Tipado específico para Feather
declare module 'react-native-vector-icons/Feather' {
  import { ComponentType } from 'react';
  import { TextProps } from 'react-native';

  type IconProps = {
    name: string;       // nombre del ícono
    size?: number;      // tamaño opcional
    color?: string;     // color opcional
  } & TextProps;

  const Feather: ComponentType<IconProps>;
  export default Feather;
}